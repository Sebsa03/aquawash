import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def alter_db():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Falta DATABASE_URL en el entorno")
        return

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Añadir columna activar_lealtad si no existe
        await conn.execute("""
            ALTER TABLE lavaderos
            ADD COLUMN IF NOT EXISTS activar_lealtad BOOLEAN DEFAULT FALSE;
        """)
        print("Columna activar_lealtad añadida con éxito.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(alter_db())
