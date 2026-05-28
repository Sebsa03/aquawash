import asyncio
import asyncpg
from jose import jwt
from datetime import datetime, timedelta, timezone

async def run():
    secret = "aquawash_clave_secreta_cambiar_en_produccion_2026"
    to_encode = {"sub": "demo@aquawash.com"}
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, secret, algorithm="HS256")
    
    import urllib.request, json
    req = urllib.request.Request('http://127.0.0.1:8000/inventario/movimientos', headers={'Authorization': f'Bearer {token}'}, method='GET')
    try:
        res = urllib.request.urlopen(req)
        print("SUCCESS:")
        print(res.read().decode())
    except Exception as e:
        print("ERROR:", getattr(e, 'code', 'unknown'))
        print(e.read().decode() if hasattr(e, 'read') else str(e))

asyncio.run(run())
