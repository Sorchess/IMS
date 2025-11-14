from app.models import File
from app.repositories.base_repository import BaseRepository
from app.schemas.file import FileResponse


class FilesRepository(BaseRepository):
    def __init__(self):
        super().__init__(File, FileResponse)
