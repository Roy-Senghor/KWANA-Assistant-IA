import httpx
from anthropic import Anthropic

from app.core.config import settings


def generate(system: str, user: str) -> str:
    if settings.llm_provider == "openai_compat":
        return _generate_openai_compat(system, user)
    if settings.llm_provider == "anthropic":
        return _generate_anthropic(system, user)
    if settings.llm_provider == "ollama":
        return _generate_ollama(system, user)
    raise ValueError(f"LLM_PROVIDER inconnu : {settings.llm_provider}")


def _generate_openai_compat(system: str, user: str) -> str:
    response = httpx.post(
        f"{settings.llm_base_url}/chat/completions",
        headers={"Authorization": f"Bearer {settings.llm_api_key}"},
        json={
            "model": settings.llm_model,
            "max_tokens": 1000,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def _generate_anthropic(system: str, user: str) -> str:
    client = Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


def _generate_ollama(system: str, user: str) -> str:
    response = httpx.post(
        f"{settings.ollama_url}/api/chat",
        json={
            "model": settings.ollama_model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=170,
    )
    response.raise_for_status()
    return response.json()["message"]["content"]