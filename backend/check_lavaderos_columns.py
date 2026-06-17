import os
import asyncio
from dotenv import load_dotenv
import asyncpg

async def main():
    load_dotenv(dotenv_path='backend/.env')
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        print('ERROR: DATABASE_URL no encontrada en backend/.env')
        raise SystemExit(2)

    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'lavaderos'
    ORDER BY ordinal_position;
    """)
    print('COLUMNS:')
    for r in rows:
        print(f"{r['column_name']} - {r['data_type']}")
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
