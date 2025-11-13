import uuid
import bcrypt


def generate_uuid() -> str:
    return uuid.uuid4().hex


def hash_password(
    password: str,
) -> str:
    salt = bcrypt.gensalt()
    pw_bytes = password.encode()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    return bcrypt.checkpw(
        password=password.encode(), hashed_password=hashed_password.encode()
    )
