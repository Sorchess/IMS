from app.core import S3Client, cache_storage, sessions_storage, emails_publisher
from app.repositories.files_repository import FilesRepository
from app.repositories.devices_repository import DevicesRepository
from app.repositories.telemetry_repository import TelemetryRepository
from app.repositories.users_repository import UsersRepository
from app.services.auth_service import AuthService
from app.services.cookie_service import CookieService
from app.services.devices_service import DevicesService
from app.services.emails_service import EmailsService
from app.services.files_service import FilesService
from app.services.telemetry_service import TelemetryService
from app.services.users_service import UsersService

_users_repo = UsersRepository()
_files_repo = FilesRepository()
_s3 = S3Client()
_cookie = CookieService()
_devices_repo = DevicesRepository()
_telemetry_repo = TelemetryRepository()


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


def get_emails_service() -> EmailsService:
    return EmailsService(
        publisher=emails_publisher,
        repository=_users_repo,
        auth_service=get_auth_serivce(),
        users_service=get_user_serivce(),
        cache_storage=cache_storage,
    )


def get_files_serivce() -> FilesService:
    return FilesService(
        files_repository=_files_repo,
        s3_client=_s3,
    )


def get_devices_service() -> DevicesService:
    return DevicesService(
        repository=_devices_repo,
        cache_storage=cache_storage,
    )


def get_telemetry_service() -> TelemetryService:
    return TelemetryService(
        telemetry_repository=_telemetry_repo,
        cache_storage=cache_storage,
        devices_repository=_devices_repo,
    )
