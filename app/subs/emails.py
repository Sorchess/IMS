from jinja2 import Environment, FileSystemLoader
from pydantic import EmailStr
from faststream.rabbit import RabbitRouter

from app.core import email_backend

router = RabbitRouter()


@router.subscriber("emails")
async def send_email(
    email: EmailStr,
    payload: str,
):

    env = Environment(
        loader=FileSystemLoader("/app/templates"),  # обязателно / в начале
        autoescape=True,  # Автоматическое экранирование HTML
    )
    template = env.get_template("confirmation.html")
    html_content = template.render(
        code=payload,
    )

    email_backend.send_email(
        recipient=email,
        subject="Cowork: space for students",
        html_content=html_content,
    )
