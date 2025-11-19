import pytest
from httpx import AsyncClient
from fastapi import status

from app.core import settings


@pytest.mark.anyio
async def test_me_flow(async_client: AsyncClient):
    payload = {
        "email": "me@example.com",
        "password": "StrongPass123!",
    }
    resp = await async_client.post(
        f"{settings.api.prefix}/v1/users/sign-up", json=payload
    )
    assert resp.status_code == status.HTTP_200_OK

    resp_login = await async_client.post(
        f"{settings.api.prefix}/v1/users/sign-in",
        json={
            "email": payload["email"],
            "password": payload["password"],
        },
    )
    assert resp_login.status_code == status.HTTP_200_OK
    cookies = resp_login.cookies

    resp_me = await async_client.get(
        f"{settings.api.prefix}/v1/users/me", cookies=cookies
    )
    assert resp_me.status_code == status.HTTP_200_OK
    me = resp_me.json()
    assert me["email"] == payload["email"]
