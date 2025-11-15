from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_user_id
from app.core import db_manager
from app.core.exceptions import (
    DeprecatedTokenException,
    DeprecatedTokenHTTPException,
    DeviceAlreadyExistsException,
    DeviceAlreadyExistsHTTPException,
    DeviceNotFoundException,
    DeviceNotFoundHTTPException,
    NotAuthorizedException,
    NotAuthorizedHTTPException,
)
from app.schemas.device import DeviceCreate
from app.services import DevicesService, get_devices_service

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/token")
async def get_token(
    device_create: DeviceCreate,
    devices_service: DevicesService = Depends(get_devices_service),
):
    token = await devices_service.get_token(device_create=device_create)
    return {
        "status": "success",
        "token": token,
    }


@router.post("/", status_code=201)
async def add_device(
    token: str,
    user_id: int = Depends(get_user_id),
    devices_service: DevicesService = Depends(get_devices_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        data = await devices_service.add_device(
            user_id=user_id, token=token, session=session
        )
        return {
            "status": "success",
            "message": "Device added successfully",
            "data": data,
        }
    except DeprecatedTokenException:
        raise DeprecatedTokenHTTPException
    except DeviceAlreadyExistsException:
        raise DeviceAlreadyExistsHTTPException


@router.delete("/{device_id:int}", status_code=204)
async def delete_device(
    device_id: int,
    user_id: int = Depends(get_user_id),
    devices_service: DevicesService = Depends(get_devices_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await devices_service.delete_device(
            device_id=device_id, user_id=user_id, session=session
        )
        return {
            "status": "success",
            "message": "Device deleted successfully",
        }
    except DeviceNotFoundException:
        raise DeviceNotFoundHTTPException
    except NotAuthorizedException:
        raise NotAuthorizedHTTPException


@router.get("/{device_id:int}")
async def get_device(
    device_id: int,
    user_id: int = Depends(get_user_id),
    devices_service: DevicesService = Depends(get_devices_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        data = await devices_service.get_device(
            user_id=user_id, device_id=device_id, session=session
        )
        return {
            "status": "success",
            "data": data,
        }
    except DeviceNotFoundException:
        raise DeviceNotFoundHTTPException


@router.get("/")
async def get_devices(
    user_id: int = Depends(get_user_id),
    devices_service: DevicesService = Depends(get_devices_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        data = await devices_service.get_devices(user_id=user_id, session=session)
        return {
            "status": "success",
            "data": data,
        }
    except DeviceNotFoundException:
        raise DeviceNotFoundHTTPException
