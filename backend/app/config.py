import os
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path)

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
    superadmin_password_hash: str = os.getenv("SUPERADMIN_PASSWORD", "$2b$12$QIpsBytJ1cigKsgEuRqq5eDLI.EeGd/OKrOQC4Pi4t40rPs98lATu")

settings = Settings()

