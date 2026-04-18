from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ArtFlow AI"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+pg8000://postgres:postgres@localhost:5432/artflow"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "artflow"
    MINIO_SECURE: bool = False

    # JWT
    SECRET_KEY: str = "your-super-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Doubao API
    DOUBAO_API_KEY: Optional[str] = None
    DOUBAO_TEXT_MODEL: Optional[str] = None
    DOUBAO_IMAGE_MODEL: Optional[str] = None
    DOUBAO_IMAGE2TEXT_MODEL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()