from app.core.config import settings


def test_info_exposes_no_secret(client, monkeypatch):
    monkeypatch.setattr(settings, "llm_api_key", "cle-secrete-1")
    monkeypatch.setattr(settings, "anthropic_api_key", "cle-secrete-2")

    res = client.get("/info")

    assert res.status_code == 200
    assert "cle-secrete-1" not in res.text
    assert "cle-secrete-2" not in res.text
    assert set(res.json()) == {"provider", "model", "min_score", "embedding_model"}