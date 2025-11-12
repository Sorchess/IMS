import logging
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core import settings, broker
from app.core.db_manager import db_manager


logging.basicConfig(
    level=settings.logging.log_level_value,
    format=settings.logging.log_format,
    datefmt=settings.logging.date_format,
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    await db_manager.init_database()  # Создание таблиц в бд
    await broker.start()  # Запуск брокера

    yield

    await broker.stop()  # Остановка брокера
    await db_manager.dispose()  # Остановка бд


app = FastAPI(
    title="IPC Monitoring",
    lifespan=lifespan,
)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        reload=True,
        host="0.0.0.0",
        port=8000,
    )
