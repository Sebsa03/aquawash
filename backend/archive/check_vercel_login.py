"""
Script de verificación de login en Vercel — solo para uso local.
Reemplaza TEST_EMAIL y TEST_PASSWORD con tus valores antes de ejecutar.
"""
import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()

def check_vercel_login():
    print("\nRevisando login en Vercel...")
    # Usa variables de entorno o reemplaza aquí para pruebas puntuales
    email = os.environ.get("TEST_EMAIL", "test@example.com")
    password = os.environ.get("TEST_PASSWORD", "")
    try:
        data = json.dumps({"email": email, "password": password}).encode()
        req2 = urllib.request.Request(
            "https://aquawash-lemon.vercel.app/auth/login",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req2) as resp2:
            print(resp2.status, resp2.read().decode())
    except Exception as e:
        print("Error en login:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == "__main__":
    check_vercel_login()
