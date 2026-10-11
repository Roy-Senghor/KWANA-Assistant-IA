from app.services.chunking import split_text


def test_empty_text_gives_no_chunk():
    assert split_text("") == []
    assert split_text("   \n  ") == []


def test_short_text_gives_one_chunk():
    assert split_text("Bonjour Kwana") == ["Bonjour Kwana"]


def test_chunks_respect_max_size():
    text = " ".join(["mot"] * 1000)
    chunks = split_text(text, size=200, overlap=50)
    assert len(chunks) > 1
    assert all(len(c) <= 200 for c in chunks)


def test_chunks_only_contain_whole_words():
    words = [f"mot{i:04d}" for i in range(300)]
    chunks = split_text(" ".join(words), size=200, overlap=50)
    for chunk in chunks:
        assert set(chunk.split()) <= set(words)


def test_no_word_is_lost():
    words = [f"mot{i:04d}" for i in range(300)]
    chunks = split_text(" ".join(words), size=200, overlap=50)
    covered = set()
    for chunk in chunks:
        covered |= set(chunk.split())
    assert covered == set(words)