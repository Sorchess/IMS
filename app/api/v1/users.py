from fastapi import APIRouter, Depends, File, UploadFile, Response, Request
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_user_id
from app.core import db_manager
from app.core.exceptions import (
    UserNotFoundException,
    UserNotFoundHTTPException,
    UserAlreadyExistsException,
    UserAlreadyExistsHTTPException,
    UserEmailNotVerificatedException,
    UserEmailNotVerificatedHTTPException,
    UserWrongPasswordException,
    UserWrongPasswordHTTPException,
    InvalidSessionCookieException,
    InvalidSessionCookieHTTPException,
)
from app.schemas.user import UserCreate, UserUpdate, UserCredentials
from app.services import (
    UsersService,
    get_user_serivce,
    AuthService,
    get_auth_serivce,
    EmailsService,
    get_emails_service,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_personal_info(
    user_service: UsersService = Depends(get_user_serivce),
    user_id: int = Depends(get_user_id),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        result = await user_service.get_user_info(
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "data": result,
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException


@router.get("/{user_id:int}")
async def get_user(
    user_id: int,
    user_service: UsersService = Depends(get_user_serivce),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        result = await user_service.get_user_info(
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "data": result,
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException


@router.post(
    "/sign-up",
)
async def register_user(
    user_create: UserCreate,
    response: Response,
    user_service: UsersService = Depends(get_user_serivce),
    auth_service: AuthService = Depends(get_auth_serivce),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        user_id = await user_service.create_user(
            user_create=user_create, session=session
        )
        data = await user_service.get_user_info(
            user_id=user_id,
            session=session,
        )
        await auth_service.sign_in(
            user_credentials=user_create,
            session=session,
            response=response,
        )

        return {
            "status": "success",
            "message": "User created successfully.",
            "data": data,
        }
    except UserAlreadyExistsException:
        raise UserAlreadyExistsHTTPException
    except UserNotFoundException:
        raise UserNotFoundHTTPException
    except UserWrongPasswordException:
        raise UserWrongPasswordHTTPException


@router.post("/sign-in")
async def sign_in(
    response: Response,
    user_credentials: UserCredentials,
    user_service: UsersService = Depends(get_user_serivce),
    auth_service: AuthService = Depends(get_auth_serivce),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        user_id = await auth_service.sign_in(
            response=response,
            user_credentials=user_credentials,
            session=session,
        )
        data = await user_service.get_user_info(
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "message": "You have successfully logged in.",
            "data": data,
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException
    except UserWrongPasswordException:
        raise UserWrongPasswordHTTPException


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    auth_service: AuthService = Depends(get_auth_serivce),
):
    try:
        await auth_service.logout(
            response=response,
            request=request,
        )
        return {
            "status": "success",
            "message": "You have successfully logged out.",
        }
    except InvalidSessionCookieException:
        raise InvalidSessionCookieHTTPException


@router.post("/edit")
async def edit_profile(
    user_update: UserUpdate,
    user_id: int = Depends(get_user_id),
    emails_service: EmailsService = Depends(get_emails_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await emails_service.edit_user(
            user_update=user_update,
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "message": "Code sent successfully",
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException
    except UserEmailNotVerificatedException:
        raise UserEmailNotVerificatedHTTPException


@router.delete("/delete")
async def delete_user(
    user_id: int = Depends(get_user_id),
    emails_service: EmailsService = Depends(get_emails_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await emails_service.delete_user(
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "message": "Code sent successfully",
        }
    except InvalidSessionCookieException:
        raise InvalidSessionCookieHTTPException
    except UserNotFoundException:
        raise UserNotFoundHTTPException
    except UserEmailNotVerificatedException:
        raise UserEmailNotVerificatedHTTPException


@router.post("/verify-email")
async def verify_email(
    emails_service: EmailsService = Depends(get_emails_service),
    user_id: int = Depends(get_user_id),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await emails_service.verify_email(
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "message": "Code sent successfully",
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException


@router.patch("/change-avatar")
async def change_avatar(
    file: UploadFile = File(...),
    user_id: int = Depends(get_user_id),
    user_service: UsersService = Depends(get_user_serivce),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await user_service.change_avatar(
            file=file,
            user_id=user_id,
            session=session,
        )
        return {
            "status": "success",
            "message": "Avatar changed successfully.",
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException


@router.post("/forgot-password")
async def forgot_password(
    email: EmailStr,
    emails_service: EmailsService = Depends(get_emails_service),
    session: AsyncSession = Depends(db_manager.session_getter),
):
    try:
        await emails_service.forgot_password(
            email=email,
            session=session,
        )
        return {
            "status": "success",
            "message": "A link to restore access has been sent to your email.",
        }
    except UserNotFoundException:
        raise UserNotFoundHTTPException
    except UserEmailNotVerificatedException:
        raise UserEmailNotVerificatedHTTPException
