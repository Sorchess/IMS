import logging

from faststream import FastStream

from app.core import settings, broker
from app.subs.emails import router as emails_router

app = FastStream(broker)

broker.include_router(emails_router)


@app.after_startup
async def configure_logging() -> None:
    logging.basicConfig(
        level=settings.logging.log_level_value,
        format=settings.logging.log_format,
        datefmt=settings.logging.date_format,
    )
