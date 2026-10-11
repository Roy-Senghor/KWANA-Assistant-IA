from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    upload_dir: str = "data/uploads"


settings = Settings()