from pathlib import Path


from pydantic import BaseModel, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseConfig(BaseModel):
    url: PostgresDsn  # парсит url базы данных
    echo: bool = False  # логирование SQL-запросов
    echo_pool: bool = False  # логирование работы пула соединений
    pool_size: int = 50  # максимальное количество соединений в пуле
    max_overflow: int = (
        10  # допустимое количество "временных" соединений сверх pool_size
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        case_sensitive=False,  # True если нужно учитывать регистр переменной
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
    )
    db: DatabaseConfig


settings = Settings()
