import pytest
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()


@pytest.fixture(scope="session")
def base_url():
    """URL base de la aplicación"""
    return os.getenv("FRONTEND_URL", "https://aquawash.pages.dev/")


@pytest.fixture(scope="session")
def test_user():
    """Usuario de prueba"""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "phone": "+34612345678"
    }


@pytest.fixture(scope="session")
def api_url():
    """URL base de la API"""
    return os.getenv("API_URL", "http://localhost:8000")
