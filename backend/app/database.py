import asyncio
import asyncpg
from app.config import settings
from typing import Optional
from asyncpg.pool import Pool

# Pool de conexiones — en lugar de abrir y cerrar una conexión
# por cada petición, se mantiene un grupo de conexiones listas
# para usar. Más eficiente y soporta múltiples lavaderos simultáneos.
pool: Optional[Pool] = None
pool_lock = asyncio.Lock()

async def conectar():
    """Abre el pool de conexiones al iniciar el servidor."""
    global pool
    async with pool_lock:
        if pool is None:
            pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=1,   # conexiones mínimas siempre activas
                max_size=3    # máximo de conexiones simultáneas (optimizado para Serverless/Vercel)
            )

async def desconectar():
    """Cierra el pool al apagar el servidor."""
    global pool
    async with pool_lock:
        if pool:
            await pool.close()
            pool = None

async def get_db():
    """
    Dependency de FastAPI.
    Cada endpoint que necesite la BD recibe una conexión,
    la usa, y se devuelve automáticamente al pool.
    """
    global pool
    if pool is None:
        await conectar()

    async with pool.acquire() as conexion:
        yield conexion