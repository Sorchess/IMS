from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Integer,
    ForeignKey,
    Float,
    JSON,
)
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.models import Base

if TYPE_CHECKING:
    from .device import Device


class Telemetry(Base):
    __tablename__ = "telemetry"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"))
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, default=lambda: datetime.now(timezone.utc)
    )
    cpu: Mapped[dict] = mapped_column(JSON, default=dict)
    memory: Mapped[dict] = mapped_column(JSON, default=dict)
    disk: Mapped[dict] = mapped_column(JSON, default=dict)
    sensors: Mapped[dict] = mapped_column(JSON, default=dict)
    network: Mapped[dict] = mapped_column(JSON, default=dict)

    # Relationships
    device: Mapped["Device"] = relationship("Device", back_populates="telemetry")
