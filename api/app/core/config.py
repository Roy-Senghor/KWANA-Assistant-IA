from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    upload_dir: str = "/data/uploads"
    model_cache_dir: str = "/models"
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"



settings = Settings()