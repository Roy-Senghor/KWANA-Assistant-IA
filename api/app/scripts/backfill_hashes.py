import hashlib
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import Document


def main() -> None:
    with SessionLocal() as db:
        seen = set(
            db.scalars(select(Document.content_hash).where(Document.content_hash.is_not(None)))
        )
        docs = db.scalars(
            select(Document).where(Document.content_hash.is_(None)).order_by(Document.id)
        ).all()

        for doc in docs:
            path = Path(settings.upload_dir) / f"{doc.id}{Path(doc.filename).suffix.lower()}"
            if not path.exists():
                print(f"#{doc.id} {doc.filename} : fichier introuvable, ignoré")
                continue

            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest in seen:
                print(f"#{doc.id} {doc.filename} : doublon, à supprimer depuis l'interface")
                continue

            doc.content_hash = digest
            seen.add(digest)
            print(f"#{doc.id} {doc.filename} : empreinte enregistrée")

        db.commit()


if __name__ == "__main__":
    main()