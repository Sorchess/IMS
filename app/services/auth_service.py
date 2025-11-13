from fastapi import Response, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    MissingSessionCookieException,
    InvalidSessionCookieException,
    ObjectNotFoundException,
    UserNotFoundException,
    UserWrongPasswordException,
)
from app.core.redis_manager import RedisStorage
from app.core.security import generate_uuid, verify_password
from app.repositories.users_repository import UsersRepository
from app.schemas.user import UserCredentials, UserResponce
from app.services.cookie_service import CookieService


class AuthService:
    def __init__(
        self,
        cookie_serivce: CookieService,
        session_storage: RedisStorage,
        repository: UsersRepository,
    ):
        self.cookie_serivce = cookie_serivce
        self.repository = repository
        self.session_storage = session_storage

    async def create_session(self, user_id: int) -> str:
        session_id = generate_uuid()
        age = settings.cookie.age * 24 * 60 * 60
        await self.session_storage.set(key=session_id, value=user_id, expire=age)
        return session_id

    async def verify_cookie(self, request: Request) -> int:
        cookie_value = self.cookie_serivce.get_session_id(request=request)

        if not cookie_value:
            raise MissingSessionCookieException

        user_id = await self.session_storage.get(key=cookie_value)

        if not user_id:
            raise InvalidSessionCookieException

        return user_id

    async def verify_user(
        self, user_credentials: UserCredentials, session: AsyncSession
    ) -> UserResponce:
        try:
            user = await self.repository.get_model(
                session=session, email=user_credentials.email
            )
        except ObjectNotFoundException:
            raise UserNotFoundException

        if not verify_password(user_credentials.password, user.password):
            raise UserWrongPasswordException

        return UserResponce.model_validate(user)

    async def sign_in(
        self,
        user_credentials: UserCredentials,
        response: Response,
        session: AsyncSession,
    ) -> int:
        try:
            user = await self.verify_user(
                user_credentials=user_credentials,
                session=session,
            )
        except UserNotFoundException:
            raise UserNotFoundException
        except UserWrongPasswordException:
            raise UserWrongPasswordException

        session_id = await self.create_session(user_id=user.id)
        self.cookie_serivce.set_auth_cookie(response=response, session_id=session_id)
        return user.id

    async def logout(
        self,
        response: Response,
        request: Request,
    ) -> None:
        cookie_value = self.cookie_serivce.get_session_id(request=request)

        user_id = await self.session_storage.get(cookie_value)

        if not user_id:
            raise InvalidSessionCookieException

        await self.session_storage.delete(cookie_value)

        self.cookie_serivce.delete_auth_cookie(response=response)
