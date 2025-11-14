from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc

from app.models import Telemetry
from app.repositories.base_repository import BaseRepository
from app.schemas.telemetry import TelemetryResponse, TelemetryPagination, TelemetryOrder


class TelemetryRepository(BaseRepository):
    def __init__(self):
        super().__init__(Telemetry, TelemetryResponse)

    async def get_filtered(
        self, session: AsyncSession, pagination: TelemetryPagination, **kwargs
    ) -> list[TelemetryResponse]:
        stmt = select(self.model).filter_by(**kwargs)
        if pagination.order == TelemetryOrder.OLD:

            stmt = stmt.order_by(
                desc(self.model.ts),
                desc(self.model.id),
            )

        else:
            stmt = stmt.order_by(
                asc(self.model.ts),
                asc(self.model.id),
            )

        if pagination.offset:
            stmt = stmt.offset(pagination.offset)
        if pagination.limit:
            stmt = stmt.limit(pagination.limit)

        result = await session.execute(stmt)
        result = result.scalars().all()

        return [self.schema.model_validate(instance) for instance in result]
