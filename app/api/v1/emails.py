from fastapi import APIRouter, Depends, Request, Response
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_user_id
from app.core import db_manager
from app.core.exceptions import (
    InvalidTokenHTTPException,
    InvalidTokenException,
    TooManyAttemptsHTTPException,
    TooManyAttemptsException,
    DeprecatedTokenHTTPException,
    DeprecatedTokenException,
)
from app.services import EmailsService, get_emails_service

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("/confirm")
async def confirm_code(
    response: Response,
    request: Request,
    code: SecretStr,
    user_id: int = Depends(get_user_id),
    emails_service: EmailsService = Depends(get_emails_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await emails_service.verify_code(
            code=code,
            user_id=user_id,
            session=session,
            response=response,
            request=request,
        )
        return {
            "status": "success",
            "message": "The verification code has been successfully verified.",
        }
    except InvalidTokenException:
        raise InvalidTokenHTTPException
    except TooManyAttemptsException:
        raise TooManyAttemptsHTTPException


@router.patch("/reset-password")
async def reset_password(
    token: str,
    password: str,
    emails_service: EmailsService = Depends(get_emails_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await emails_service.reset_password(
            token=token,
            new_password=password,
            session=session,
        )
        return {
            "status": "success",
            "message": "Password reset successfully.",
        }
    except InvalidTokenException:
        raise InvalidTokenHTTPException
    except DeprecatedTokenException:
        raise DeprecatedTokenHTTPException
