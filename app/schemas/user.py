from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, HttpUrl


class UserCredentials(BaseModel):
    email: EmailStr = Field(min_length=4, max_length=255)
    password: str = Field(min_length=8)


class UserCreate(UserCredentials):
    pass


class UserUpdate(UserCredentials):
    email: EmailStr | None = Field(min_length=4, max_length=255)
    avatar: str | None = Field(min_length=4, max_length=255)
    username: str | None = Field(min_length=4, max_length=32)
    password: str | None = Field(min_length=8, max_length=32)


class UserResponce(BaseModel):
    id: int
    username: str
    email: EmailStr
    email_verified: bool
    registered_in: datetime
    avatar_url: Optional[HttpUrl] = None

    model_config = ConfigDict(from_attributes=True)