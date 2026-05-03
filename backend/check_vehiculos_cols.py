import asyncio, asyncpg, os
from dotenv import load_dotenv

load_dotenv()

async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    cols = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vehiculos_catalogo'")
    for c in cols:
        print(dict(c))
    await conn.close()

asyncio.run(main())
