"""
Script de verificación: Comprueba que Selenium está correctamente instalado
Uso: python verify_selenium.py
"""

import sys
from pathlib import Path

def check_imports():
    """Verificar que todas las importaciones funcionan"""
    print("Verificando importaciones...")
    
    try:
        import selenium
        print(f"✓ Selenium {selenium.__version__}")
    except ImportError as e:
        print(f"✗ Selenium no instalado: {e}")
        return False
    
    try:
        import webdriver_manager
        print(f"✓ WebDriver Manager instalado")
    except ImportError as e:
        print(f"✗ WebDriver Manager no instalado: {e}")
        return False
    
    try:
        import pytest
        print(f"✓ Pytest instalado")
    except ImportError as e:
        print(f"✗ Pytest no instalado: {e}")
        return False
    
    return True


def check_selenium_structure():
    """Verificar que la estructura de pruebas existe"""
    print("\nVerificando estructura de pruebas...")
    
    required_files = [
        "tests/conftest.py",
        "tests/e2e/conftest.py",
        "tests/e2e/test_login.py",
        "tests/e2e/test_navigation.py",
        "tests/e2e/test_modulos.py",
        "pytest.ini",
    ]
    
    base_path = Path(__file__).parent
    all_exist = True
    
    for file in required_files:
        path = base_path / file
        if path.exists():
            print(f"✓ {file}")
        else:
            print(f"✗ {file} - NO ENCONTRADO")
            all_exist = False
    
    return all_exist


def check_env_file():
    """Verificar archivo .env"""
    print("\nVerificando archivo .env...")
    
    base_path = Path(__file__).parent
    env_file = base_path / ".env"
    env_example = base_path / ".env.example"
    
    if env_file.exists():
        print("✓ .env encontrado")
        return True
    else:
        print("✗ .env no encontrado")
        if env_example.exists():
            print(f"  Crea uno basado en .env.example:")
            print(f"  copy {env_example} {env_file}")
        return False


def main():
    print("="*60)
    print("VERIFICACIÓN DE SELENIUM")
    print("="*60 + "\n")
    
    all_ok = True
    
    # Verificar importaciones
    if not check_imports():
        all_ok = False
    
    # Verificar estructura
    if not check_selenium_structure():
        all_ok = False
    
    # Verificar .env
    if not check_env_file():
        all_ok = False
    
    print("\n" + "="*60)
    if all_ok:
        print("✓ TODO ESTÁ CORRECTAMENTE CONFIGURADO")
        print("\nPuedes ejecutar las pruebas con:")
        print("  pytest tests/e2e/ -v")
        print("="*60)
        return 0
    else:
        print("✗ PROBLEMAS ENCONTRADOS")
        print("\nIntenta:")
        print("  pip install -r requirements.txt")
        print("="*60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
