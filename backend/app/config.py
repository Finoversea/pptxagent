"""Application configuration."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Claude API configuration
    anthropic_api_key: str = ""
    claude_model: str = "claude-3-5-sonnet-20241022"  # Use stable Sonnet 3.5

    # Storage configuration
    storage_path: str = "./storage"

    # Redis configuration (optional)
    redis_url: str = ""

    # API configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()