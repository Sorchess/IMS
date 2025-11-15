from fastapi import Depends, Request

from app.core.exceptions import (
    InvalidSessionCookieHTTPException,
    InvalidSessionCookieException,
    MissingSessionCookieException,
    MissingSessionCookieHTTPException,
)
from app.services import get_auth_serivce, AuthService


async def get_user_id(
    request: Request,
    auth_service: AuthService = Depends(get_auth_serivce),
) -> int:
    """Зависимость для получения ID текущего пользователя"""
    try:
        return await auth_service.verify_cookie(request=request)
    except MissingSessionCookieException:
        raise MissingSessionCookieHTTPException
    except InvalidSessionCookieException:
        raise InvalidSessionCookieHTTPException
