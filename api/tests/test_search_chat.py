import pytest

from app.routers.chat import NO_ANSWER


@pytest.fixture
def query_is_vector_0(monkeypatch, unit_vector):
    """La question « ressemble » exactement au vecteur 0, sans modèle d'IA."""
    monkeypatch.setattr("app.services.retrieval.embed_texts", lambda texts: [unit_vector(0)])


def test_search_orders_by_similarity(client, add_document, unit_vector, query_is_vector_0):
    add_document(
        "cours.txt",
        [
            ("Nginx est un reverse proxy.", unit_vector(1)),
            ("Les volumes conservent les données.", unit_vector(0)),
        ],
    )

    res = client.post("/search", json={"query": "volumes", "top_k": 2})

    results = res.json()
    assert [r["content"] for r in results] == [
        "Les volumes conservent les données.",
        "Nginx est un reverse proxy.",
    ]
    assert results[0]["score"] == pytest.approx(1.0, abs=1e-3)
    assert results[1]["score"] == pytest.approx(0.0, abs=1e-3)


def test_search_validates_input(client):
    assert client.post("/search", json={"query": ""}).status_code == 422
    assert client.post("/search", json={"query": "x", "top_k": 500}).status_code == 422


def test_deleted_document_is_no_longer_searchable(
    client, add_document, unit_vector, query_is_vector_0
):
    doc_id = add_document("cours.txt", [("Les volumes.", unit_vector(0))])
    assert len(client.post("/search", json={"query": "x"}).json()) == 1

    client.delete(f"/documents/{doc_id}")

    assert client.post("/search", json={"query": "x"}).json() == []


def test_chat_refuses_without_calling_llm_when_nothing_relevant(
    client, add_document, unit_vector, query_is_vector_0, monkeypatch
):
    # le seul passage est orthogonal à la question : score 0, sous le seuil
    add_document("cours.txt", [("Sans rapport.", unit_vector(1))])

    def llm_must_not_be_called(system, user):
        raise AssertionError("Le LLM ne doit pas être appelé")

    monkeypatch.setattr("app.routers.chat.generate", llm_must_not_be_called)

    res = client.post("/chat", json={"question": "Une question"})

    assert res.status_code == 200
    assert res.json() == {"answer": NO_ANSWER, "sources": []}


def test_chat_answers_with_sources(
    client, add_document, unit_vector, query_is_vector_0, monkeypatch
):
    add_document("cours.txt", [("Un volume conserve les données.", unit_vector(0))])
    captured = {}

    def fake_generate(system, user):
        captured["user"] = user
        return "Grâce aux volumes [1]."

    monkeypatch.setattr("app.routers.chat.generate", fake_generate)

    res = client.post("/chat", json={"question": "Comment garder mes données ?"})

    assert res.status_code == 200
    body = res.json()
    assert body["answer"] == "Grâce aux volumes [1]."
    assert body["sources"][0]["filename"] == "cours.txt"
    assert "Un volume conserve les données." in captured["user"]
    assert "Comment garder mes données ?" in captured["user"]


def test_chat_returns_502_when_llm_fails(
    client, add_document, unit_vector, query_is_vector_0, monkeypatch
):
    add_document("cours.txt", [("Un volume.", unit_vector(0))])

    def broken_llm(system, user):
        raise RuntimeError("panne")

    monkeypatch.setattr("app.routers.chat.generate", broken_llm)

    res = client.post("/chat", json={"question": "Une question"})

    assert res.status_code == 502