import time

from celery import Celery

from app.core.config import settings

celery_app = Celery("kwana", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task
def ping(seconds: int = 2) -> str:
    time.sleep(seconds)
    return "pong"
