from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

class DeviceBase(BaseModel):
    name: str = Field(min_length=1, max_length=16, examples=["ipc-01"])

class DeviceCreate(DeviceBase):
    pass

class DeviceDB(DeviceBase):
    token: str
    owner_id: int

class DeviceResponse(DeviceBase):
    id: int
    token: str
    status: str
    created_at: datetime
    owner_id: int
    last_seen_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)