from pydantic import BaseModel, ConfigDict


class FileCreate(BaseModel):
    key: str
    owner_id: int
    size: int
    origin: str


class FileResponse(BaseModel):
    file_id: int
    key: str
    origin: str
    size: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)
