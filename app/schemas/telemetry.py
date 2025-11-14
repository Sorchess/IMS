from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class TelemetryBase(BaseModel):
    device_id: int
    ts: datetime
    cpu: dict
    memory: dict
    disk: dict
    sensors: dict
    network: dict

class TelemetryUpload(TelemetryBase):
    pass


class TelemetryResponse(TelemetryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class TelemetryOrder(str, Enum):
    OLD = "old"
    NEW = "new"

class TelemetryPagination(BaseModel):
    limit: int = Field(gt=0, default=20)
    offset: int = Field(ge=0, default=0)
    order: TelemetryOrder = TelemetryOrder.OLD
