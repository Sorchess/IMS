from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.security import generate_uuid
from app.models.base import Base


DEFAULT_AVATAR_KEY = "default.webp"


class User(Base):
    """Класс для опредения таблицы users, наследуется от класса base, который хранит все метаданные"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        unique=True,
        autoincrement=True,
        index=True,
    )
    username: Mapped[str] = mapped_column(
        String(32), index=True, nullable=False, default=generate_uuid
    )
    avatar: Mapped[str] = mapped_column(
        String(255), nullable=False, default=DEFAULT_AVATAR_KEY
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    registered_in: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now,
    )