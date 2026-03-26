import asyncpg
import os
from dotenv import load_dotenv

# Carga las variables del archivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Pool de conexiones — en lugar de abrir y cerrar una conexión
# por cada petición, se mantiene un grupo de conexiones listas
# para usar. Más eficiente y soporta múltiples lavaderos simultáneos.
pool = None

async def conectar():
    """Abre el pool de conexiones al iniciar el servidor."""
    global pool
    pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=2,   # conexiones mínimas siempre activas
        max_size=10   # máximo de conexiones simultáneas
    )

async def desconectar():
    """Cierra el pool al apagar el servidor."""
    global pool
    if pool:
        await pool.close()

async def get_db():
    """
    Dependency de FastAPI.
    Cada endpoint que necesite la BD recibe una conexión,
    la usa, y se devuelve automáticamente al pool.
    """
    async with pool.acquire() as conexion:
        yield conexion