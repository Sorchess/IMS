import logging
import mimetypes
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional
from urllib.parse import quote, unquote

import unicodedata
from aiobotocore.session import get_session
from botocore.client import Config as BotoConfig
from fastapi import UploadFile
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.exceptions import (
    StreamingFileFailedException,
    FileNotFoundException,
    FileDeleteFailedException,
    InvalidMetadataException,
    NotAuthorizedException,
    FileTooLargeException,
    FileUploadFailedException,
    EmptyFileException,
)

logger = logging.getLogger(__name__)


class S3Client:
    def __init__(
        self,
        access_key: str = settings.s3.access_key,
        secret_key: str = settings.s3.secret_key,
        endpoint_url: str = settings.s3.endpoint_url,
        bucket_name: str = settings.s3.bucket_name,
    ):
        boto_config = BotoConfig(
            connect_timeout=15,
            read_timeout=60,
            retries={"max_attempts": 3},
            max_pool_connections=20,
            tcp_keepalive=True,
            signature_version="s3v4",
        )
        self.config = {
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
            "endpoint_url": endpoint_url,
            "config": boto_config,
        }
        self.bucket_name = bucket_name
        self.session = get_session()

    @asynccontextmanager
    async def get_client(self):
        async with self.session.create_client("s3", **self.config) as client:
            yield client

    @staticmethod
    def _ext_from_upload(file: UploadFile) -> str:
        ext = None
        if file.content_type:
            ext = mimetypes.guess_extension(file.content_type, strict=False)
            if ext == ".jpe":
                ext = ".jpg"
        if not ext and file.filename:
            ext = Path(file.filename).suffix
        return ext or ".bin"

    async def upload_file(
        self,
        file: UploadFile,
        user_id: int,
        folder: str = "uploads",
    ) -> str:
        key = uuid.uuid4().hex
        content_type = file.content_type or "application/octet-stream"
        ext = self._ext_from_upload(file)

        path = f"public/{folder}/{key}{ext}"

        data = await file.read()
        size = len(data)
        if size == 0:
            raise EmptyFileException
        if size > settings.s3.max_size * 1024 * 1024:
            raise FileTooLargeException

        original_name = file.filename or "unknown"
        meta_value = quote(original_name)

        metadata = {
            "author_id": str(user_id),
            "original-filename": meta_value,
        }

        async with self.get_client() as client:
            try:
                await client.put_object(
                    Key=path,
                    Body=data,
                    Bucket=self.bucket_name,
                    ContentType=content_type,
                    ContentLength=size,
                    Metadata=metadata,
                )
                return f"{key}{ext}"
            except Exception as exception:
                logger.error(f"S3 upload failed: {exception}")
                raise FileUploadFailedException

    @staticmethod
    def _ascii_fallback(name: str, default: str) -> str:
        normalized = unicodedata.normalize("NFKD", name)
        ascii_only = normalized.encode("ascii", "ignore").decode("ascii").strip()
        ascii_only = ascii_only.replace("/", "_").replace("\\", "_").replace(" ", "_")

        if not ascii_only:
            return default
        return ascii_only[:180]

    def _build_content_disposition(
        self, original_name: Optional[str], default_name: str
    ) -> str:
        safe_ascii = self._ascii_fallback(original_name or "", default=default_name)
        utf8_name = original_name or default_name
        quoted_ascii = safe_ascii.replace('"', '\\"')
        filename_star = quote(utf8_name, safe="!#$&+-.^_`|~")
        return (
            f"attachment; filename=\"{quoted_ascii}\"; filename*=UTF-8''{filename_star}"
        )

    async def _get_file_chunk(
        self,
        key: str,
        content_length: int,
        chunk_length: int,
    ) -> AsyncGenerator[bytes, None]:
        async with self.get_client() as client:
            for offset in range(0, content_length, chunk_length):
                end = min(offset + chunk_length - 1, content_length - 1)
                s3_file = await client.get_object(
                    Bucket=self.bucket_name, Key=key, Range=f"bytes={offset}-{end}"
                )

                async with s3_file["Body"] as stream:
                    yield await stream.read()

    async def proxy_file(
        self,
        file_name: str,
        folder: str = "uploads",
    ):
        key = f"public/{folder}/{file_name}"
        chunk_lenght = 1024 * 1024

        async with self.get_client() as client:
            try:
                resp = await client.head_object(Key=key, Bucket=self.bucket_name)
            except client.exceptions.NoSuchKey:
                raise FileNotFoundException
            except:
                raise StreamingFileFailedException

        content_length = resp.get("ContentLength")
        content_type: str = resp.get("ContentType") or "application/octet-stream"

        meta = resp.get("Metadata") or {}
        encoded_name = meta.get("original-filename")
        original_name = None

        if encoded_name:
            try:
                original_name = unquote(encoded_name)
            except Exception as exception:
                logger.warning(f"Error with unquote file name: {exception}")

        disposition = self._build_content_disposition(
            original_name=original_name, default_name=file_name
        )

        headers = {
            "Content-Disposition": disposition,
            "Content-Length": str(content_length),
            "Accept-Ranges": "bytes",
        }

        file_chunk_iterator = self._get_file_chunk(
            key=key,
            content_length=content_length,
            chunk_length=chunk_lenght,
        )
        return StreamingResponse(
            content=file_chunk_iterator, media_type=content_type, headers=headers
        )

    async def delete_file(
        self,
        file_name: str,
        user_id: int,
        folder: str = "uploads",
    ):
        key = f"public/{folder}/{file_name}"

        async with self.get_client() as client:

            try:
                resp = await client.head_object(Key=key, Bucket=self.bucket_name)
            except client.exceptions.NoSuchKey:
                raise FileNotFoundException
            except:
                raise FileDeleteFailedException

            meta = resp.get("Metadata") or {}
            author = meta.get("author_id")

            if not author:
                raise InvalidMetadataException

            try:
                author_id = int(author)
            except ValueError:
                raise InvalidMetadataException

            if author_id != user_id:
                raise NotAuthorizedException

            try:
                await client.delete_object(Bucket=self.bucket_name, Key=key)
            except:
                raise FileDeleteFailedException

    async def get_presigned_url(
        self,
        file_name: str,
        expires_in: int,
        folder: str = "uploads",
    ) -> str:
        key = f"public/{folder}/{file_name}"
        params = {"Bucket": self.bucket_name, "Key": key}
        async with self.get_client() as client:
            return await client.generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=expires_in,
                HttpMethod="GET",
            )
