"""
Script de prueba local — NO ejecutar en producción.
Requiere que SECRET_KEY esté definida en el entorno o en backend/.env
"""
import asyncio
import os
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta, timezone

load_dotenv()

async def run():
    secret = os.environ.get("SECRET_KEY")
    if not secret:
        print("ERROR: SECRET_KEY no está definida en el entorno.")
        print("Define la variable en backend/.env antes de ejecutar este script.")
        return

    to_encode = {"sub": "demo@aquawash.com"}
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, secret, algorithm="HS256")

    import urllib.request, json
    req = urllib.request.Request(
        'http://127.0.0.1:8000/inventario/movimientos',
        headers={'Authorization': f'Bearer {token}'},
        method='GET'
    )
    try:
        res = urllib.request.urlopen(req)
        print("SUCCESS:")
        print(res.read().decode())
    except Exception as e:
        print("ERROR:", getattr(e, 'code', 'unknown'))
        print(e.read().decode() if hasattr(e, 'read') else str(e))

asyncio.run(run())
