from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    upload_dir: str = "/data/uploads"
    model_cache_dir: str = "/models"
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5-20251001"
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5:3b"
    min_score: float = 0.3

    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""


settings = Settings()