from typing import Optional
from datetime import date

async def create_lavadero(db, *, nombre: str, ciudad: Optional[str], telefono: Optional[str],
                         email: str, password_hash: str, pin_dueno: str, pin_operario: str,
                         plan: str = 'pro', estado_suscripcion: str = 'trial', trial_hasta=None,
                         pais: str = 'CO', moneda: str = 'COP', auth_provider: str = 'local', provider_id: Optional[str] = None):
    """Crea un registro en la tabla `lavaderos` con valores por defecto mantenidos en un solo lugar."""
    # Valores de precio por defecto mantenidos aquí para facilitar cambios futuros
    precio_moto = 10000
    precio_carro = 15000
    precio_furgon = 20000
    precio_camion = 25000
    precio_bus = 30000

    row = await db.fetchrow(
        """
        INSERT INTO lavaderos (
            nombre, ciudad, telefono, email, password_hash,
            pin_dueno, pin_operario, plan, estado_suscripcion, trial_hasta,
            precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus,
            pais, moneda, auth_provider, provider_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING *
        """,
        nombre, ciudad, telefono, email, password_hash,
        pin_dueno, pin_operario, plan, estado_suscripcion, trial_hasta,
        precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus,
        pais, moneda, auth_provider, provider_id
    )
    return row


async def create_default_adicionales(db, lavadero_id: int):
    """Inserta la lista estándar de adicionales para un lavadero."""
    adicionales = [
        ("Aspirado", 5000),
        ("Encerado", 8000),
        ("Lavado de motor", 12000),
        ("Pulida de rines", 6000),
        ("Ambientador", 3000)
    ]
    for nombre, precio in adicionales:
        await db.execute(
            "INSERT INTO adicionales_catalogo (lavadero_id, nombre, precio) VALUES ($1,$2,$3)",
            lavadero_id, nombre, precio
        )


async def create_default_empleados(db, lavadero_id: int):
    empleados = ["Carlos Martínez", "Leo Torres", "Andrés Gómez"]
    for nombre in empleados:
        await db.execute("INSERT INTO empleados (lavadero_id, nombre) VALUES ($1,$2)", lavadero_id, nombre)
