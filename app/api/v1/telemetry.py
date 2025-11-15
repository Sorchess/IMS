from fastapi import APIRouter, Depends, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_user_id
from app.core import db_manager
from app.core.exceptions import DeviceNotFoundException, DeviceNotFoundHTTPException
from app.schemas.telemetry import TelemetryPagination
from app.services import get_telemetry_service
from app.services.telemetry_service import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.websocket("/")
async def ws_device(
    token: str,
    ws: WebSocket,
    session: AsyncSession = Depends(db_manager.session_getter),
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
):
    await telemetry_service.open_ws(ws=ws, token=token, session=session)


@router.get("/{device_id}")
async def get_telemetry(
    device_id: int,
    pagination: TelemetryPagination = Depends(),
    user_id: int = Depends(get_user_id),
    session: AsyncSession = Depends(db_manager.session_getter),
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
):
    try:
        data = await telemetry_service.get_telemetry(
            device_id=device_id, user_id=user_id, pagination=pagination, session=session
        )
        return {
            "status": "success",
            "data": data,
        }
    except DeviceNotFoundException:
        raise DeviceNotFoundHTTPException
