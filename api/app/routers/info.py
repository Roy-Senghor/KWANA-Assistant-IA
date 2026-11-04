from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/info", tags=["info"])


@router.get("")
def info():
    models = {
        "openai_compat": settings.llm_model,
        "anthropic": settings.anthropic_model,
        "ollama": settings.ollama_model,
    }
    return {
        "provider": settings.llm_provider,
        "model": models.get(settings.llm_provider, ""),
        "min_score": settings.min_score,
        "embedding_model": settings.embedding_model,
    }