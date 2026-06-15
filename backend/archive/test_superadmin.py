"""
Script de prueba local — NO ejecutar en producción.
Las credenciales se leen de las variables de entorno definidas en backend/.env
"""
import json
import os
import urllib.request
from dotenv import load_dotenv

load_dotenv()

def test():
    email = os.environ.get("SUPERADMIN_EMAIL", "admin@aquawash.com")
    password = os.environ.get("SUPERADMIN_PASSWORD")
    if not password:
        print("ERROR: SUPERADMIN_PASSWORD no está definida en el entorno.")
        return

    req = urllib.request.Request(
        "http://127.0.0.1:8000/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        print("Login:", resp.status, res)
        token = res["access_token"]

    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/superadmin/lavaderos",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req2) as resp2:
        print("Lavaderos:", resp2.status, resp2.read().decode())

if __name__ == "__main__":
    test()
