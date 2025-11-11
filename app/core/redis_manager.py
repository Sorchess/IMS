import json

from pydantic import RedisDsn
from redis.asyncio import Redis

from app.core.config import settings


class RedisStorage:
    def __init__(self, namespace: str, url: RedisDsn, db: int):
        base_url = str(url).rstrip("/0")
        self.namespace = namespace
        self.client = Redis.from_url(
            url=f"{base_url}/{db}",
            decode_responses=True,
        )

    async def hset(self, key: str, values: any, expire: int | None = None):
        await self.client.hset(
            name=f"{self.namespace}:{key}",
            mapping=values,
        )
        await self.client.expire(
            name=f"{self.namespace}:{key}",
            time=expire,
        )

    async def hget(self, key: str, attr: str):
        await self.client.hget(
            name=f"{self.namespace}:{key}",
            key=attr,
        )

    async def hgetall(self, key: str):
        data = await self.client.hgetall(
            name=f"{self.namespace}:{key}",
        )
        return data

    async def set(self, key: str, value: any, expire: int | None = None):
        await self.client.set(
            name=f"{self.namespace}:{key}",
            value=json.dumps(value),
            ex=expire,
        )

    async def decr(self, key: str):
        await self.client.decr(
            name=f"{self.namespace}:{key}",
        )

    async def get(self, key: str):
        data = await self.client.get(
            name=f"{self.namespace}:{key}",
        )
        return json.loads(data) if data else None

    async def delete(self, key: str):
        await self.client.delete(
            f"{self.namespace}:{key}",
        )

    async def exists(self, key: str) -> bool:
        return await self.client.exists(
            f"{self.namespace}:{key}",
        )


sessions_storage = RedisStorage(namespace="sessions", url=settings.redis.url, db=0)
cache_storage = RedisStorage(namespace="cache", url=settings.redis.url, db=1)
