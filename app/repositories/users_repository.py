from app.models import User
from .base_repository import BaseRepository
from app.schemas.user import UserResponce


class UsersRepository(BaseRepository):
    def __init__(self):
        super().__init__(User, UserResponce)
