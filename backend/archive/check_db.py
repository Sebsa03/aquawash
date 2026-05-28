import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    # 1. Ver qué columnas tiene lavaderos
    print("--- SCHEMA LAVADEROS ---")
    filas = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lavaderos'")
    for f in filas:
        print(f["column_name"], f["data_type"])
        
    # 2. Ver lavaderos actuales
    print("\n--- LAVADEROS ---")
    lavs = await conn.fetch("SELECT id, nombre FROM lavaderos")
    for l in lavs:
        print(l["id"], l["nombre"])
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
