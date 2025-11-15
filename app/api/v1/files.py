from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_user_id
from app.core import db_manager
from app.core.exceptions import (
    StreamingFileFailedException,
    StreamingFileFailedHTTPException,
    FileNotFoundException,
    FileNotFoundHTTPException,
    InvalidMetadataException,
    NotAuthorizedException,
    FileDeleteFailedException,
    InvalidMetadataHTTPException,
    NotAuthorizedHTTPException,
    FileDeleteFailedHTTPException,
    FileTooLargeHTTPException,
    FileTooLargeException,
    FileUploadFailedException,
    FileUploadFailedHTTPException,
    EmptyFileException,
    EmptyFileExceptionHTTPException,
)
from app.services import get_files_serivce
from app.services.files_service import FilesService

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/file/")
async def upload_file(
    user_id: int = Depends(get_user_id),
    file: UploadFile = File(...),
    files_service: FilesService = Depends(get_files_serivce),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        data = await files_service.upload_file(
            user_id=user_id,
            file=file,
            session=session,
        )
        return {
            "status": "success",
            "message": "File uploaded successfully.",
            "data": data,
        }
    except EmptyFileException:
        raise EmptyFileExceptionHTTPException
    except FileTooLargeException:
        raise FileTooLargeHTTPException
    except FileUploadFailedException:
        raise FileUploadFailedHTTPException


@router.get("/file/{file_name}")
async def proxy_file(
    file_name: str,
    files_service: FilesService = Depends(get_files_serivce),
):
    try:
        return await files_service.proxy_file(
            file_name=file_name,
        )
    except StreamingFileFailedException:
        raise StreamingFileFailedHTTPException
    except FileNotFoundException:
        raise FileNotFoundHTTPException


@router.delete("/file/{file_name}")
async def delete_file(
    file_name: str,
    files_service: FilesService = Depends(get_files_serivce),
    user_id: int = Depends(get_user_id),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await files_service.delete_file(
            user_id=user_id,
            file_name=file_name,
            session=session,
        )
        return {
            "status": "success",
            "message": "File deleted successfully.",
        }
    except FileNotFoundException:
        raise FileNotFoundHTTPException
    except InvalidMetadataException:
        raise InvalidMetadataHTTPException
    except NotAuthorizedException:
        raise NotAuthorizedHTTPException
    except FileDeleteFailedException:
        raise FileDeleteFailedHTTPException
