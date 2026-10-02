import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "MealSense Forecast Service"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "placeholder-service-key")
    SERVICE_SHARED_SECRET: str = os.getenv("SERVICE_SHARED_SECRET", "super-secret-forecast-token")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEFAULT_CONFIDENCE_TARGET: float = 0.80  # 80% coverage for conformal intervals

settings = Settings()
