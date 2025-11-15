import asyncio
import logging
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ObjectNotFoundException,
    DeviceNotFoundException,
    NotAuthorizedException,
)
from app.core.redis_manager import RedisStorage
from app.repositories.devices_repository import DevicesRepository
from app.repositories.telemetry_repository import TelemetryRepository
from app.schemas.telemetry import TelemetryUpload, TelemetryPagination

logger = logging.getLogger(__name__)

RECONNECT_INTERVAL_SEC = 5
RECONNECT_TIMEOUT_SEC = 120


class TelemetryService:
    def __init__(
        self,
        devices_repository: DevicesRepository,
        telemetry_repository: TelemetryRepository,
        cache_storage: RedisStorage,
    ):
        self.devices = devices_repository
        self.telemetry = telemetry_repository
        self.cache_storage = cache_storage

    async def get_telemetry(
        self,
        user_id: int,
        device_id: int,
        pagination: TelemetryPagination,
        session: AsyncSession,
    ):
        try:
            device = await self.devices.get_one(session=session, id=device_id)
        except ObjectNotFoundException:
            raise DeviceNotFoundException

        if device.owner_id != user_id:
            raise NotAuthorizedException

        return await self.telemetry.get_filtered(
            session=session, device_id=device_id, pagination=pagination
        )

    async def _handle_telemetry(
        self, device_id: int, ws: WebSocket, token: str, session: AsyncSession
    ):

        await self.devices.patch(
            session=session, token=token, column="status", value="online"
        )

        try:
            await ws.send_json(
                {"type": "telemetry", "ts": datetime.now(timezone.utc).isoformat()}
            )

            while True:
                msg = await ws.receive_json()
                if msg["type"] == "telemetry":
                    payload = msg["payload"]

                    telemetry = TelemetryUpload(
                        device_id=device_id,
                        ts=payload["ts"],
                        cpu=payload["cpu"],
                        memory=payload["memory"],
                        disk=payload["disk"],
                        sensors=payload["sensors"],
                        network=payload["network"],
                    )

                    await self.telemetry.add(session=session, schema=telemetry)

                    await self.devices.patch(
                        session=session,
                        token=token,
                        column="last_seen_at",
                        value=datetime.now(timezone.utc),
                    )

                    await ws.send_json({"type": "ack", "ts": msg["payload"]["ts"]})
        except WebSocketDisconnect:
            await self.devices.patch(
                session=session, token=token, column="status", value="offline"
            )
        except Exception as e:
            logger.warning(e)
            try:
                await ws.close(code=1008, reason="Protocol error")
            except RuntimeError:
                pass

    async def open_ws(self, ws: WebSocket, token: str, session: AsyncSession):
        async def find_device():
            try:
                return await self.devices.get_one(session=session, token=token)
            except ObjectNotFoundException:
                return None

        device = await find_device()

        if device:
            await ws.accept()
            return await self._handle_telemetry(
                ws=ws,
                token=token,
                device_id=device.id,
                session=session,
            )

        exists = await self.cache_storage.exists(key=token)

        if exists:
            await ws.accept()
            start = asyncio.get_event_loop().time()
            while True:
                await ws.send_json(
                    {"type": "reconnect", "ts": datetime.now(timezone.utc).isoformat()}
                )
                device = await find_device()

                if device:
                    return await self._handle_telemetry(
                        ws=ws,
                        token=token,
                        device_id=device.id,
                        session=session,
                    )

                elapsed = asyncio.get_event_loop().time() - start
                if elapsed >= RECONNECT_TIMEOUT_SEC:
                    return await ws.close(code=1008, reason="Provision timeout")

                await asyncio.sleep(RECONNECT_INTERVAL_SEC)

        await ws.close(code=1008, reason="Invalid token")
