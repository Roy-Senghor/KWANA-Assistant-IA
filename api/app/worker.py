import time

from celery import Celery

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import Document

celery_app = Celery("kwana", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task
def ping(seconds: int = 2) -> str:
    time.sleep(seconds)
    return "pong"


@celery_app.task
def process_document(document_id: int) -> None:
    with SessionLocal() as db:
        doc = db.get(Document, document_id)
        if doc is None:
            return

        doc.status = "processing"
        db.commit()

        try:
            # Simulation. À l'étape suivante : extraction du texte,
            # découpage en chunks et calcul des embeddings.
            time.sleep(3)
            doc.status = "done"
        except Exception:
            doc.status = "failed"
            raise
        finally:
            db.commit()