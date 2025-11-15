import json
import logging

from faststream.rabbit.publisher import RabbitPublisher
from pydantic import SecretStr, EmailStr
from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import emails_publisher
from app.core.config import settings
from app.core.exceptions import (
    InvalidTokenException,
    TooManyAttemptsException,
    ObjectNotFoundException,
    UserNotFoundException,
    UserEmailNotVerificatedException,
    DeprecatedTokenException,
)
from app.core.redis_manager import RedisStorage
from app.repositories.users_repository import UsersRepository
from app.schemas.confirmation import ConfirmationRequest, ConfirmationAction
from app.schemas.token import TokenScope, TokenPayload
from app.schemas.user import UserResponce, UserUpdate
from app.core.security import (
    hash_password,
    verify_password,
    generate_secret_code,
    decode_jwt,
    encode_jwt,
    generate_uuid,
)
from .auth_service import AuthService
from .users_service import UsersService

logger = logging.getLogger(__name__)


class EmailsService:
    def __init__(
        self,
        repository: UsersRepository,
        publisher: RabbitPublisher,
        cache_storage: RedisStorage,
        users_service: UsersService,
        auth_service: AuthService,
    ):
        self.repository = repository
        self.publisher = publisher
        self.cache_storage = cache_storage
        self.users_service = users_service
        self.auth_service = auth_service

    @staticmethod
    def _redis_keys(user_id: int) -> str:
        return f"confirm:user:{user_id}"

    async def send_confirmation_code(
        self,
        action: ConfirmationAction,
        user: UserResponce,
        payload: str = "",
    ) -> None:
        key = self._redis_keys(user_id=user.id)

        code = generate_secret_code()
        code_hash = hash_password(code)

        values = ConfirmationRequest(action=action, code=code_hash, payload=payload)
        expire = settings.verification.ttl * 60

        await self.cache_storage.hset(
            key=key,
            values=values.model_dump(),
            expire=expire,
        )

        await self.publisher.publish(
            message={
                "email": user.email,
                "payload": code,
            },
        )

    async def verify_code(
        self,
        user_id: int,
        code: SecretStr,
        session: AsyncSession,
        response: Response,
        request: Request,
    ) -> None:

        key = self._redis_keys(user_id=user_id)
        values = await self.cache_storage.hgetall(key=key)

        if not values:
            raise InvalidTokenException

        if not verify_password(
            password=code.get_secret_value(),
            hashed_password=values.get("code"),
        ):
            values["attempts"] = str(int(values.get("attempts")) - 1)

            await self.cache_storage.hset(
                key=key,
                values=values,
            )

            if int(values.get("attempts", "0")) <= 0:
                await self.cache_storage.delete(
                    key=key,
                )
                raise TooManyAttemptsException

            raise InvalidTokenException

        await self.cache_storage.delete(key=key)

        if values.get("action") == ConfirmationAction.EMAIL_VERIFICATION:
            await self.users_service.verify_email(
                user_id=user_id,
                session=session,
            )

        elif values.get("action") == ConfirmationAction.USER_DELETION:
            await self.users_service.delete_user(
                user_id=user_id,
                session=session,
            )
            await self.auth_service.logout(
                response=response,
                request=request,
            )
        elif values.get("action") == ConfirmationAction.EDIT_USER:
            if values.get("payload") is None:
                raise InvalidTokenException
            await self.users_service.edit_user(
                user_id=user_id,
                session=session,
                user_update=UserUpdate(**json.loads(values.get("payload"))),
            )
        else:
            raise InvalidTokenException

    async def edit_user(
        self,
        user_id: int,
        session: AsyncSession,
        user_update: UserUpdate,
    ) -> None:
        try:
            user = await self.repository.get_one(session=session, id=user_id)
        except ObjectNotFoundException:
            raise UserNotFoundException

        if not user.email_verified:
            raise UserEmailNotVerificatedException

        await self.send_confirmation_code(
            user=user,
            action=ConfirmationAction.EDIT_USER,
            payload=user_update.model_dump_json(exclude_unset=True, exclude_none=True),
        )

    async def delete_user(
        self,
        user_id: int,
        session: AsyncSession,
    ) -> None:
        try:
            user = await self.repository.get_one(session=session, id=user_id)
        except ObjectNotFoundException:
            raise UserNotFoundException

        if not user.email_verified:
            raise UserEmailNotVerificatedException

        await self.send_confirmation_code(
            action=ConfirmationAction.USER_DELETION,
            user=user,
        )

    async def forgot_password(
        self,
        email: EmailStr,
        session: AsyncSession,
    ) -> None:
        try:
            user = await self.repository.get_one(session=session, email=email)
        except ObjectNotFoundException:
            raise UserNotFoundException

        if not user.email_verified:
            raise UserEmailNotVerificatedException

        payload = TokenPayload(
            user=user.id,
            jti=generate_uuid(),
            scope=TokenScope.PASSWORD_RESET,
        )
        token = encode_jwt(payload=payload)

        key = f"password_reset:user:{user.id}"
        expire = settings.jwt.ttl * 60

        await self.cache_storage.hset(
            key=key,
            values=payload.model_dump(),
            expire=expire,
        )

        await emails_publisher.publish(
            message={
                "email": user.email,
                "payload": token,
            },
        )

    async def verify_email(
        self,
        user_id: int,
        session: AsyncSession,
    ) -> None:
        try:
            user = await self.repository.get_one(session=session, id=user_id)
        except ObjectNotFoundException:
            raise UserNotFoundException

        await self.send_confirmation_code(
            action=ConfirmationAction.EMAIL_VERIFICATION,
            user=user,
        )

    async def reset_password(
        self,
        token: str,
        new_password: str,
        session: AsyncSession,
    ) -> None:
        payload = decode_jwt(token=token)

        if payload.get("scope") != TokenScope.PASSWORD_RESET:
            raise InvalidTokenException

        user_id = payload.get("sub")
        jti = payload.get("jti")

        if not user_id or not jti:
            raise InvalidTokenException

        key = f"password_reset:user:{user_id}"
        values = await self.cache_storage.hgetall(key=key)

        if not values:
            raise DeprecatedTokenException

        if values["jti"] != jti:
            raise InvalidTokenException

        await self.users_service.edit_user(
            session=session,
            user_id=user_id,
            user_update=UserUpdate(password=new_password),
        )
        await self.cache_storage.delete(key=key)
