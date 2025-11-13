from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ObjectAlreadyExistsException,
    UserAlreadyExistsException,
    ObjectNotFoundException,
    UserNotFoundException,
    UnsupportedMediaTypeException,
)
from app.core.redis_manager import RedisStorage
from app.core.s3_client import S3Client
from app.models.user import DEFAULT_AVATAR_KEY
from app.repositories.users_repository import UsersRepository
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponce,
)


from app.core.security import (
    hash_password,
)

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}


class UsersService:
    def __init__(
        self,
        repository: UsersRepository,
        s3_storage: S3Client,
        cache_storage: RedisStorage,
    ):
        self.cache_storage = cache_storage
        self.s3_storage = s3_storage
        self.repository = repository

    async def get_user_info(
        self,
        user_id: int,
        session: AsyncSession,
    ) -> UserResponce:
        try:
            user = await self.repository.get_model(session=session, id=user_id)
        except ObjectNotFoundException:
            raise UserNotFoundException

        folder = "presets" if user.avatar == DEFAULT_AVATAR_KEY else "uploads"

        user.avatar_url = await self.s3_storage.get_presigned_url(
            folder=folder,
            file_name=user.avatar,
            expires_in=300,
        )

        return UserResponce.model_validate(user)

    async def create_user(
        self,
        user_create: UserCreate,
        session: AsyncSession,
    ) -> int:

        new_user = UserCreate(
            email=user_create.email,
            password=hash_password(user_create.password),
        )

        try:
            user = await self.repository.add(schema=new_user, session=session)
        except ObjectAlreadyExistsException:
            raise UserAlreadyExistsException
        return user.id

    async def change_avatar(
        self,
        session: AsyncSession,
        user_id: int,
        file: UploadFile,
    ) -> None:
        try:
            await self.repository.get_one(session=session, id=user_id)
        except ObjectNotFoundException:
            raise UserNotFoundException

        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise UnsupportedMediaTypeException

        key = await self.s3_storage.upload_file(
            user_id=user_id,
            file=file,
        )

        await self.repository.patch(
            session=session, id=user_id, column="avatar", value=key
        )

    async def verify_email(
        self,
        user_id: int,
        session: AsyncSession,
    ) -> None:
        await self.repository.patch(
            session=session, id=user_id, column="email_verified", value=True
        )

    async def edit_user(
        self,
        user_id: int,
        session: AsyncSession,
        user_update: UserUpdate,
    ) -> None:
        if user_update.password:
            setattr(user_update, "password", hash_password(user_update.password))

        await self.repository.update(session=session, id=user_id, schema=user_update)

        if user_update.email:
            await self.repository.patch(
                session=session, id=user_id, column="email_verified", value=False
            )

    async def delete_user(
        self,
        user_id: int,
        session: AsyncSession,
    ) -> None:
        await self.repository.delete(session=session, id=user_id)
