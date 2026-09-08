import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CoalGov - AI Governance Operating Layer API"
    VERSION: str = "12.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./coal_governance.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-sih-2026-coal-governance-key-981273")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    OBJECT_STORAGE_BUCKET: str = "coal-governance-evidence"

settings = Settings()
