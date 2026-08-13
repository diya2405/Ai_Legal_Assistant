from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from .env file."""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:Xa%21Ua8%24jr_Pfxe%2F@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
    )
    DIRECT_URL: str = ""
    
    # LLM API Keys
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    
    # App Config
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    SECRET_KEY: str = "change-me-in-production"
    CLASSIFICATION_CONFIDENCE_THRESHOLD: float = 0.55
    
    # Rate Limiting
    RATE_LIMIT: str = "20/minute"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS comma-separated string into a list."""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        # Add Vercel wildcard domain pattern support
        origins.append("*")
        return origins
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
