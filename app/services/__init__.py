from app.core import S3Client, cache_storage, sessions_storage
from app.repositories.files_repository import FilesRepository
from app.repositories.users_repository import UsersRepository
from app.services.auth_service import AuthService
from app.services.cookie_service import CookieService
from app.services.devices_service import DevicesService
from app.services.files_service import FilesService
from app.services.users_service import UsersService

_users_repo = UsersRepository()
_files_repo = FilesRepository()
_s3 = S3Client()
_cookie = CookieService()


def get_user_serivce() -> UsersService:
    return UsersService(
        repository=_users_repo,
        s3_storage=_s3,
        cache_storage=cache_storage,
    )


def get_auth_serivce() -> AuthService:
    return AuthService(
        repository=_users_repo,
        cookie_serivce=_cookie,
        session_storage=sessions_storage,
    )


def get_files_serivce() -> FilesService:
    return FilesService(
        files_repository=_files_repo,
        s3_client=_s3,
    )
