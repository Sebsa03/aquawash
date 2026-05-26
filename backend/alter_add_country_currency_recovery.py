import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def alter_lavaderos_table():
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ Error: No se encontró DATABASE_URL en las variables de entorno.")
        return

    try:
        conn = await asyncpg.connect(database_url)
        print("🔄 Alterando tabla 'lavaderos'...")

        alter_queries = [
            "ALTER TABLE lavaderos ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Desconocido';",
            "ALTER TABLE lavaderos ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'USD';",
            "ALTER TABLE lavaderos ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);",
            "ALTER TABLE lavaderos ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;",
            "ALTER TABLE lavaderos ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';",
            "ALTER TABLE lavaderos ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);"
        ]

        for query in alter_queries:
            await conn.execute(query)
            print(f"✅ Ejecutado: {query}")

        print("🎉 Modificaciones a la tabla lavaderos completadas exitosamente.")
        await conn.close()

    except Exception as e:
        print(f"❌ Error al alterar la tabla: {e}")

if __name__ == "__main__":
    asyncio.run(alter_lavaderos_table())
