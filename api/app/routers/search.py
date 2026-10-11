from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Chunk, Document
from app.services.embeddings import embed_texts

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=4, ge=1, le=20)


@router.post("")
def search(payload: SearchRequest, db: Session = Depends(get_db)):
    query_vector = embed_texts([payload.query])[0]
    distance = Chunk.embedding.cosine_distance(query_vector).label("distance")

    rows = db.execute(
        select(Chunk, Document.filename, distance)
        .join(Document, Document.id == Chunk.document_id)
        .where(Chunk.embedding.is_not(None))
        .order_by(distance)
        .limit(payload.top_k)
    ).all()

    return [
        {
            "document_id": chunk.document_id,
            "filename": filename,
            "chunk_index": chunk.chunk_index,
            "score": round(1 - dist, 4),
            "content": chunk.content,
        }
        for chunk, filename, dist in rows
    ]