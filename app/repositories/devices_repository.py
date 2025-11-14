from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Device
from app.repositories.base_repository import BaseRepository
from app.schemas.device import DeviceResponse


class DevicesRepository(BaseRepository):
    def __init__(self):
        super().__init__(Device, DeviceResponse)

    async def get_owned(self, user_id: int, session: AsyncSession, **kwargs):
        data = await self.get_one(session, **kwargs)
        return data if data.owner_id == user_id else None

    async def get_filtered(
        self, session: AsyncSession, **kwargs
    ) -> list[DeviceResponse]:
        stmt = select(self.model).filter_by(**kwargs)

        stmt = stmt.order_by(
            desc(self.model.last_seen_at),
            desc(self.model.id),
        )

        result = await session.execute(stmt)
        result = result.scalars().all()

        return [self.schema.model_validate(instance) for instance in result]
