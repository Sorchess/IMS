import logging
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

LOG_DEFAULT_FORMAT = (
    "[%(asctime)s.%(msecs)03d] %(module)10s:%(lineno)-3d %(levelname)-7s - %(message)s"
)

class LoggingConfig(BaseModel):
    log_level: Literal[
        "debug",
        "info",
        "warning",
        "error",
        "critical",
    ] = "info"
    log_format: str = LOG_DEFAULT_FORMAT
    date_format: str = "%Y-%m-%d %H:%M:%S"

    @property
    def log_level_value(self) -> int:
        return logging.getLevelNamesMapping()[self.log_level.upper()]


class RedisConfig(BaseModel):
    url: RedisDsn


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
    logging: LoggingConfig = LoggingConfig()
    redis: RedisConfig
    db: DatabaseConfig


settings = Settings()
