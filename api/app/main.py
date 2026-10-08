from fastapi import FastAPI
from sqlalchemy import text

from app.core.db import engine

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