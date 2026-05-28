import asyncio
import os
import asyncpg

async def test_connection():
    url = os.getenv('DATABASE_URL', 'postgresql://postgres:2003@localhost:5432/lavadero')
    print('DATABASE_URL=', url)
    try:
        conn = await asyncpg.connect(url)
        print('DB CONNECT OK')
        await conn.close()
    except Exception as e:
        print('DB CONNECT ERROR:', type(e).__name__, e)

if __name__ == '__main__':
    asyncio.run(test_connection())
