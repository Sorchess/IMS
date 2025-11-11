from faststream.rabbit import RabbitBroker
from app.core.config import settings

broker = RabbitBroker(
    url=str(settings.broker.url),
    reconnect_interval=5,
)

emails_publisher = broker.publisher(queue="emails")
