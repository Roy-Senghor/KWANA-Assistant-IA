import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app as fastapi_app
from app.models import Chunk, Document

TEST_DB_NAME = "kwana_test"


@pytest.fixture(scope="session")
def engine():
    """Crée la base kwana_test (une fois pour toute la session de tests)."""
    real_url = make_url(settings.database_url)
    test_url = real_url.set(database=TEST_DB_NAME)

    admin = create_engine(real_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": TEST_DB_NAME},
        ).scalar()
        if not exists:
            conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    admin.dispose()

    test_engine = create_engine(test_url)
    with test_engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(test_engine)

    yield test_engine

    Base.metadata.drop_all(test_engine)
    test_engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables(engine):
    """Vide les tables après chaque test pour qu'ils restent indépendants."""
    yield
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE chunks, documents RESTART IDENTITY CASCADE"))


@pytest.fixture
def db(engine):
    session = sessionmaker(bind=engine, autoflush=False)()
    yield session
    session.close()


class FakeTask:
    """Remplace la tâche Celery : on note les appels au lieu de les exécuter."""

    def __init__(self):
        self.calls = []

    def delay(self, *args):
        self.calls.append(args)


@pytest.fixture
def fake_task(monkeypatch):
    task = FakeTask()
    monkeypatch.setattr("app.routers.documents.process_document", task)
    return task


@pytest.fixture
def client(engine, tmp_path, monkeypatch, fake_task):
    Session = sessionmaker(bind=engine, autoflush=False)

    def override_get_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def unit_vector():
    """Un vecteur de 384 valeurs, avec un seul 1 à la position i.
    Deux vecteurs différents sont orthogonaux (similarité 0), deux identiques valent 1."""

    def make(i: int) -> list[float]:
        return [1.0 if j == i else 0.0 for j in range(384)]

    return make


@pytest.fixture
def add_document(db):
    def add(filename: str, chunks: list[tuple[str, list[float]]]) -> int:
        doc = Document(filename=filename, status="done")
        db.add(doc)
        db.flush()
        for i, (content, vector) in enumerate(chunks):
            db.add(Chunk(document_id=doc.id, chunk_index=i, content=content, embedding=vector))
        db.commit()
        return doc.id

    return add