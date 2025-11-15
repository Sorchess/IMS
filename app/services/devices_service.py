from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DeprecatedTokenException,
    ObjectNotFoundException,
    DeviceNotFoundException,
    ObjectAlreadyExistsException,
    DeviceAlreadyExistsException,
    NotAuthorizedException,
)
from app.core.redis_manager import RedisStorage
from app.core.security import generate_uuid
from app.repositories.devices_repository import DevicesRepository
from app.schemas.device import DeviceCreate, DeviceDB, DeviceResponse


class DevicesService:
    def __init__(
        self,
        repository: DevicesRepository,
        cache_storage: RedisStorage,
    ):
        self.cache_storage = cache_storage
        self.repository = repository

    async def get_token(self, device_create: DeviceCreate):
        token = generate_uuid()
        await self.cache_storage.set(key=token, value=device_create.name, expire=3600)
        return token

    async def get_device(self, user_id: int, device_id: int, session: AsyncSession):
        try:
            return await self.repository.get_owned(
                user_id=user_id, id=device_id, session=session
            )
        except ObjectNotFoundException:
            raise DeviceNotFoundException

    async def get_devices(
        self, user_id: int, session: AsyncSession
    ) -> list[DeviceResponse]:
        return await self.repository.get_filtered(owner_id=user_id, session=session)

    async def add_device(self, user_id: int, token: str, session: AsyncSession):

        device_name = await self.cache_storage.get(
            key=token,
        )

        if not device_name:
            raise DeprecatedTokenException

        device = DeviceDB(
            name=device_name,
            token=token,
            owner_id=user_id,
        )

        try:
            result = await self.repository.add(session=session, schema=device)
        except ObjectAlreadyExistsException:
            raise DeviceAlreadyExistsException

        await self.cache_storage.delete(key=token)
        return [DeviceResponse.model_validate(result)]

    async def delete_device(self, user_id: int, device_id: int, session: AsyncSession):

        try:
            device = await self.repository.get_one(session=session, id=device_id)
        except ObjectNotFoundException:
            raise DeviceNotFoundException

        if device.owner_id != user_id:
            raise NotAuthorizedException

        await self.repository.delete(session=session, id=device_id)
