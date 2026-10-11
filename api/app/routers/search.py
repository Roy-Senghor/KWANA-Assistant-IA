from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.services.retrieval import retrieve

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=4, ge=1, le=20)


@router.post("")
def search(payload: SearchRequest, db: Session = Depends(get_db)):
    return retrieve(db, payload.query, payload.top_k)