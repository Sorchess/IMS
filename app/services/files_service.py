from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    FileNotFoundException,
    StreamingFileFailedException,
    FileDeleteFailedException,
    InvalidMetadataException,
    NotAuthorizedException,
    FileTooLargeException,
    FileUploadFailedException,
    EmptyFileException,
    ObjectNotFoundException,
)
from app.core.s3_client import S3Client
from app.repositories.files_repository import FilesRepository
from app.schemas.file import FileCreate, FileResponse


class FilesService:
    def __init__(self, s3_client: S3Client, files_repository: FilesRepository):
        self.repository = files_repository
        self.s3_client = s3_client

    async def proxy_file(
        self,
        file_name: str,
    ):
        try:
            return await self.s3_client.proxy_file(
                file_name=file_name,
            )
        except FileNotFoundException:
            raise FileNotFoundException
        except StreamingFileFailedException:
            raise StreamingFileFailedException

    async def upload_file(
        self,
        user_id: int,
        file: UploadFile,
        session: AsyncSession,
    ) -> FileResponse:
        try:
            key = await self.s3_client.upload_file(
                user_id=user_id,
                file=file,
            )
        except EmptyFileException:
            raise EmptyFileException
        except FileTooLargeException:
            raise FileTooLargeException
        except FileUploadFailedException:
            raise FileUploadFailedException

        new_file = FileCreate(
            key=key,
            author_id=user_id,
            size=file.size,
            origin=file.filename or "unknown",
        )

        file_model = await self.repository.add(schema=new_file, session=session)
        return FileResponse.model_validate(file_model)

    async def delete_file(
        self,
        file_name: str,
        user_id: int,
        session: AsyncSession,
    ) -> None:
        try:
            await self.repository.get_one(session=session, key=file_name)
        except ObjectNotFoundException:
            raise FileNotFoundException

        try:
            await self.s3_client.delete_file(
                file_name=file_name,
                user_id=user_id,
            )
        except FileNotFoundException:
            raise FileNotFoundException
        except InvalidMetadataException:
            raise InvalidMetadataException
        except NotAuthorizedException:
            raise NotAuthorizedException
        except FileDeleteFailedException:
            raise FileDeleteFailedException

        await self.repository.delete(session=session, key=file_name)
