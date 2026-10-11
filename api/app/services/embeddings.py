from fastembed import TextEmbedding

from app.core.config import settings

_model: TextEmbedding | None = None


def get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding(
            model_name=settings.embedding_model,
            cache_dir=settings.model_cache_dir,
        )
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    return [vector.tolist() for vector in get_model().embed(texts)]