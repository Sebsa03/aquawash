import asyncio
import asyncpg
import json

async def run():
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/aquawash')
    rows = await conn.fetch("SELECT email, password_hash FROM lavaderos")
    for r in rows:
        print(dict(r))
    await conn.close()

asyncio.run(run())
