import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    print("Iniciando migración Fase 1...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Añadir columna metodo_pago a lavados si no existe
        print("Añadiendo columna metodo_pago a lavados...")
        await conn.execute("""
            ALTER TABLE lavados 
            ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'efectivo'
        """)

        # Crear tabla egresos
        print("Creando tabla egresos...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS egresos (
                id SERIAL PRIMARY KEY,
                lavadero_id INTEGER NOT NULL REFERENCES lavaderos(id) ON DELETE CASCADE,
                concepto VARCHAR(255) NOT NULL,
                monto INTEGER NOT NULL CHECK (monto >= 0),
                fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Índices para busquedas rápidas en reportes de caja
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_egresos_lavadero_fecha 
            ON egresos(lavadero_id, fecha)
        """)

        print("Migración Fase 1 completada con éxito.")
    except Exception as e:
        print(f"Error durante la migración: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
