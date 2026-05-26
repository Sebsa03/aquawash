import asyncpg
from app.config import settings
from typing import Optional
from asyncpg.pool import Pool

# Pool de conexiones — en lugar de abrir y cerrar una conexión
# por cada petición, se mantiene un grupo de conexiones listas
# para usar. Más eficiente y soporta múltiples lavaderos simultáneos.
# Anotamos el tipo para que el analizador sepa que `pool` puede ser
# un `Pool` o `None` (antes lo veía solo como `None`).
pool: Optional[Pool] = None

async def conectar():
    """Abre el pool de conexiones al iniciar el servidor."""
    global pool
    pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=1,   # conexiones mínimas siempre activas
        max_size=3    # máximo de conexiones simultáneas (optimizado para Serverless/Vercel)
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
    # Asegurarse al tiempo de ejecución de que el pool fue inicializado;
    # también ayuda al comprobador de tipos/static analysis.
    if pool is None:
        raise RuntimeError("Connection pool not initialized")

    async with pool.acquire() as conexion:
        yield conexion