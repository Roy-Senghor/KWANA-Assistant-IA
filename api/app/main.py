from celery.result import AsyncResult
from fastapi import FastAPI
from sqlalchemy import text

from app.core.db import engine
from app.worker import celery_app, ping

app = FastAPI(title="Kwana API")


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