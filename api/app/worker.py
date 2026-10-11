import logging
import time
from pathlib import Path

from celery import Celery
from sqlalchemy import delete

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import Chunk, Document
from app.services.chunking import split_text
from app.services.embeddings import embed_texts
from app.services.extraction import extract_text

logger = logging.getLogger(__name__)

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
            path = Path(settings.upload_dir) / f"{doc.id}{Path(doc.filename).suffix.lower()}"
            text = extract_text(path)
            pieces = split_text(text)
            if not pieces:
                raise ValueError("Aucun texte extrait (PDF scanné ?)")

            vectors = embed_texts(pieces)

            db.execute(delete(Chunk).where(Chunk.document_id == doc.id))
            db.add_all(
                Chunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=content,
                    embedding=vector,
                )
                for i, (content, vector) in enumerate(zip(pieces, vectors))
            )
            doc.status = "done"
            db.commit()
        except Exception:
            db.rollback()
            doc.status = "failed"
            db.commit()
            logger.exception("Échec du traitement du document %s", document_id)
            raise