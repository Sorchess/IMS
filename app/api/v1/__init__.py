from fastapi import APIRouter

from .users import router as users_router
from .emails import router as emails_router
from .devices import router as devices_router
from .files import router as storage_router
from .telemetry import router as telemetry_router

api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(users_router)
api_v1.include_router(emails_router)
api_v1.include_router(devices_router)
api_v1.include_router(telemetry_router)
api_v1.include_router(storage_router)
