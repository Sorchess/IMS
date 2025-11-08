from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Базовый класс, нужен для опредения таблиц в базе данных, он хранит все метаданные"""

    __abstract__ = True  # Не создает таблицу в бд
