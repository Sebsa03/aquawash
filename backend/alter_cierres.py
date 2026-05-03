import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    print("Iniciando migración Cierres de Caja...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS cierres_caja (
                id SERIAL PRIMARY KEY,
                lavadero_id INTEGER NOT NULL REFERENCES lavaderos(id) ON DELETE CASCADE,
                fecha_cierre DATE NOT NULL,
                ingresos_efectivo INTEGER NOT NULL DEFAULT 0,
                ingresos_tarjeta INTEGER NOT NULL DEFAULT 0,
                ingresos_transferencia INTEGER NOT NULL DEFAULT 0,
                egresos_total INTEGER NOT NULL DEFAULT 0,
                utilidad_neta INTEGER NOT NULL DEFAULT 0,
                observaciones TEXT,
                creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(lavadero_id, fecha_cierre)
            )
        """)
        print("Tabla cierres_caja creada con éxito.")
    except Exception as e:
        print(f"Error durante la migración: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
