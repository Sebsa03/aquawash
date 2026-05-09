import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Variables principales
    app_name: str = "AquaWash API"
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Base de datos
    database_url: str = os.getenv("DATABASE_URL")
    
    # JWT Auth
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Superadmin
    superadmin_email: str = os.getenv("SUPERADMIN_EMAIL", "admin@aquawash.com")
    superadmin_password: str = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin2026*")

settings = Settings()

