import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    print("Iniciando migración para Inventario (Fase 2)...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Tabla de Inventario (Productos)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS inventario (
                id SERIAL PRIMARY KEY,
                lavadero_id INTEGER NOT NULL REFERENCES lavaderos(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                cantidad DECIMAL(10, 2) NOT NULL DEFAULT 0,
                unidad VARCHAR(20) NOT NULL,
                stock_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0,
                UNIQUE(lavadero_id, nombre)
            )
        """)
        print("Tabla 'inventario' lista.")

        # Tabla de Recetas (Automatización de Consumo)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS recetas (
                id SERIAL PRIMARY KEY,
                lavadero_id INTEGER NOT NULL REFERENCES lavaderos(id) ON DELETE CASCADE,
                producto_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
                tipo_servicio VARCHAR(50) NOT NULL, -- 'base' o 'adicional'
                nombre_servicio VARCHAR(100) NOT NULL, -- ej. 'moto', 'carro' o 'Encerado'
                cantidad DECIMAL(10, 2) NOT NULL,
                UNIQUE(lavadero_id, producto_id, tipo_servicio, nombre_servicio)
            )
        """)
        print("Tabla 'recetas' lista.")

        # Tabla de Movimientos de Inventario (Auditoría)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS movimientos_inventario (
                id SERIAL PRIMARY KEY,
                lavadero_id INTEGER NOT NULL REFERENCES lavaderos(id) ON DELETE CASCADE,
                producto_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
                tipo VARCHAR(20) NOT NULL, -- 'entrada', 'salida', 'consumo'
                cantidad DECIMAL(10, 2) NOT NULL,
                motivo VARCHAR(255),
                fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Tabla 'movimientos_inventario' lista.")

    except Exception as e:
        print(f"Error durante la migración: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
