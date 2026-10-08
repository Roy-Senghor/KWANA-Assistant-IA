from contextlib import asynccontextmanager

from celery.result import AsyncResult
from fastapi import Depends, FastAPI
from sqlalchemy import select, text
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (enregistre les modèles)
from app.core.db import Base, engine, get_db
from app.models import Document
from app.worker import celery_app, ping


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Kwana API", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        has_vector = conn.execute(
            text("SELECT count(*) FROM pg_extension WHERE extname = 'vector'")
        ).scalar()
    return {"db": "ok", "pgvector": bool(has_vector)}


@app.post("/tasks/ping")
def launch_ping():
    task = ping.delay()
    return {"task_id": task.id}


@app.get("/tasks/{task_id}")
def task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    return {"state": result.state, "result": result.result if result.ready() else None}


@app.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    docs = db.scalars(select(Document).order_by(Document.id.desc())).all()
    return [{"id": d.id, "filename": d.filename, "status": d.status} for d in docs]