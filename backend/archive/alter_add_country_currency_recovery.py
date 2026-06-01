import argparse
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

async def alter_lavaderos_table(database_url: str):
    try:
        import asyncpg
    except ImportError:
        raise RuntimeError("asyncpg no está instalado. Ejecuta 'pip install asyncpg' en el entorno correcto.")

    if not database_url:
        raise ValueError("DATABASE_URL no provista.")

    conn = await asyncpg.connect(database_url)
    try:
        print("🔄 Alterando tabla 'lavaderos'...\n")

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

        print("\n🎉 Modificaciones a la tabla lavaderos completadas exitosamente.")
    finally:
        await conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aplica columnas faltantes a la tabla lavaderos.")
    parser.add_argument("--database-url", help="URL completa de la base de datos PostgreSQL.")
    args = parser.parse_args()

    script_root = Path(__file__).resolve().parent.parent
    dotenv_paths = [script_root / '.env', script_root / 'backend' / '.env']
    for path in dotenv_paths:
        if path.exists():
            load_dotenv(dotenv_path=path, override=False)
            print(f"Cargando variables desde: {path}")

    database_url = args.database_url or os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ Error: No se encontró DATABASE_URL. Pasa --database-url o define DATABASE_URL en backend/.env.")
    else:
        asyncio.run(alter_lavaderos_table(database_url))
