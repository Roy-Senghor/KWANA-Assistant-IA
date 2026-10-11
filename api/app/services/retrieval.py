from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Chunk, Document
from app.services.embeddings import embed_texts


def retrieve(db: Session, query: str, top_k: int = 4) -> list[dict]:
    query_vector = embed_texts([query])[0]
    distance = Chunk.embedding.cosine_distance(query_vector).label("distance")

    rows = db.execute(
        select(Chunk, Document.filename, distance)
        .join(Document, Document.id == Chunk.document_id)
        .where(Chunk.embedding.is_not(None))
        .order_by(distance)
        .limit(top_k)
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