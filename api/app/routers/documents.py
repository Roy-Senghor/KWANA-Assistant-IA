from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.models import Document
from app.worker import process_document

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}
MAX_SIZE = 20 * 1024 * 1024  # 20 Mo


def serialize(doc: Document) -> dict:
    return {"id": doc.id, "filename": doc.filename, "status": doc.status}


@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.scalars(select(Document).order_by(Document.id.desc())).all()
    return [serialize(d) for d in docs]


@router.get("/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return serialize(doc)


@router.post("", status_code=201)
def upload_document(file: UploadFile, db: Session = Depends(get_db)):
    filename = file.filename or "sans_nom"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail=f"Type de fichier non autorisé : {ext or 'aucun'}"
        )

    doc = Document(filename=filename)
    db.add(doc)
    db.flush()  # attribue l'id sans valider la transaction

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / f"{doc.id}{ext}"

    size = 0
    with dest.open("wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_SIZE:
                break
            out.write(chunk)

    if size > MAX_SIZE:
        dest.unlink(missing_ok=True)
        db.rollback()
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (20 Mo max)")

    db.commit()
    process_document.delay(doc.id)
    return serialize(doc)