import logging

from pydantic import BaseModel
from sqlalchemy import select, delete, update
from sqlalchemy.exc import NoResultFound, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ObjectNotFoundException, ObjectAlreadyExistsException

logger = logging.getLogger(__name__)


class BaseRepository:
    def __init__(self, model, schema):
        self.model = model
        self.schema = schema

    async def get_all(self, session: AsyncSession, **kwargs):
        query = select(self.model).filter_by(**kwargs)
        result = await session.execute(query)
        result = result.scalars().all()
        return [self.schema.model_validate(instance) for instance in result]

    async def get_one_or_none(self, session: AsyncSession, **kwargs):
        query = select(self.model).filter_by(**kwargs)
        result = await session.execute(query)
        result = result.scalars().one_or_none()
        return self.schema.model_validate(result) if result else None

    async def get_one(self, session: AsyncSession, **kwargs):
        stmt = select(self.model).filter_by(**kwargs)
        result = await session.execute(stmt)
        try:
            result = result.scalar_one()
        except NoResultFound:
            raise ObjectNotFoundException
        return self.schema.model_validate(result)

    async def get_model(self, session: AsyncSession, **kwargs):
        stmt = select(self.model).filter_by(**kwargs)
        result = await session.execute(stmt)
        try:
            result = result.scalar_one()
        except NoResultFound:
            raise ObjectNotFoundException
        return result

    async def add(self, schema: BaseModel, session: AsyncSession):
        model_instance = self.model(**schema.model_dump())
        session.add(model_instance)

        try:
            await session.commit()
            return model_instance
        except IntegrityError:
            await session.rollback()
            raise ObjectAlreadyExistsException

    async def patch(self, session: AsyncSession, column: str, value: any, **kwargs):
        stmt = update(self.model).filter_by(**kwargs).values({column: value})
        await session.execute(stmt)
        await session.commit()

    async def update(self, schema: BaseModel, session: AsyncSession, **kwargs):
        stmt = (
            update(self.model)
            .filter_by(**kwargs)
            .values(**schema.model_dump(exclude_none=True))
        )
        await session.execute(stmt)
        await session.commit()

    async def delete(self, session: AsyncSession, **filters):
        stmt = delete(self.model).filter_by(**filters)
        await session.execute(stmt)
        await session.commit()
