import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        await conn.execute("ALTER TABLE lavaderos ADD COLUMN meta_mensual INTEGER DEFAULT 0;")
        print("Exito")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
