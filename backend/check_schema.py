import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def q():
    c = await asyncpg.connect(os.getenv('DATABASE_URL'))
    res = await c.fetch("SELECT column_name FROM information_schema.columns WHERE table_name='lavaderos';")
    for r in res:
        print(r['column_name'])
    await c.close()

asyncio.run(q())
