from enum import Enum

from pydantic import BaseModel


class TokenScope(str, Enum):
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"


class TokenPayload(BaseModel):
    user: int
    scope: TokenScope
    jti: str