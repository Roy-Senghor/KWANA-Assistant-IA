def upload(client, name="cours.txt", content=b"Bonjour", mime="text/plain"):
    return client.post("/documents", files={"file": (name, content, mime)})


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_list_is_empty_at_start(client):
    res = client.get("/documents")
    assert res.status_code == 200
    assert res.json() == []


def test_upload_creates_document_and_queues_task(client, fake_task, tmp_path):
    res = upload(client)

    assert res.status_code == 201
    data = res.json()
    assert data["filename"] == "cours.txt"
    assert data["status"] == "pending"
    assert (tmp_path / f"{data['id']}.txt").read_bytes() == b"Bonjour"
    assert fake_task.calls == [(data["id"],)]


def test_upload_rejects_unknown_extension(client, fake_task):
    res = upload(client, "virus.exe", b"x", "application/octet-stream")

    assert res.status_code == 400
    assert fake_task.calls == []
    assert client.get("/documents").json() == []


def test_upload_rejects_file_too_large(client, fake_task, monkeypatch):
    monkeypatch.setattr("app.routers.documents.MAX_SIZE", 10)

    res = upload(client, content=b"x" * 50)

    assert res.status_code == 413
    assert fake_task.calls == []
    assert client.get("/documents").json() == []


def test_unknown_document_returns_404(client):
    assert client.get("/documents/999").status_code == 404


def test_delete_removes_row_and_file(client, tmp_path):
    created = upload(client).json()
    path = tmp_path / f"{created['id']}.txt"
    assert path.exists()

    res = client.delete(f"/documents/{created['id']}")

    assert res.status_code == 204
    assert not path.exists()
    assert client.get(f"/documents/{created['id']}").status_code == 404
    