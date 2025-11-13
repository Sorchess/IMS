from typing import Optional

from fastapi import Request, Response

from app.core import settings


class CookieService:
    def __init__(self):
        self.cookie_name = settings.cookie.name
        self.cookie_max_age = settings.cookie.age * 24 * 60 * 60

    def set_auth_cookie(self, response: Response, session_id: str) -> None:
        response.set_cookie(
            key=self.cookie_name,
            value=session_id,
            httponly=True,
            max_age=self.cookie_max_age,
        )

    def delete_auth_cookie(self, response: Response) -> None:
        response.delete_cookie(self.cookie_name)

    def get_session_id(self, request: Request) -> Optional[str]:
        return request.cookies.get(self.cookie_name)
