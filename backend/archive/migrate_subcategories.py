import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

SUBCATEGORIAS_DEFAULT = {
    "moto": [
        {"nombre": "scooter", "etiqueta": "Scooter", "precio_extra": 0},
        {"nombre": "deportiva", "etiqueta": "Deportiva +2k", "precio_extra": 2000},
        {"nombre": "touring", "etiqueta": "Touring +4k", "precio_extra": 4000},
        {"nombre": "chopper", "etiqueta": "Chopper +5k", "precio_extra": 5000}
    ],
    "carro": [
        {"nombre": "sedan", "etiqueta": "Sedán", "precio_extra": 0},
        {"nombre": "suv", "etiqueta": "SUV +3k", "precio_extra": 3000},
        {"nombre": "pickup", "etiqueta": "Pickup +4k", "precio_extra": 4000},
        {"nombre": "van", "etiqueta": "Van +5k", "precio_extra": 5000},
        {"nombre": "deportivo", "etiqueta": "Deportivo +6k", "precio_extra": 6000}
    ],
    "camion": [
        {"nombre": "sencillo", "etiqueta": "Sencillo", "precio_extra": 0},
        {"nombre": "mediano", "etiqueta": "Mediano +5k", "precio_extra": 5000},
        {"nombre": "grande", "etiqueta": "Grande +10k", "precio_extra": 10000},
        {"nombre": "tractocamion", "etiqueta": "Tractocamión +15k", "precio_extra": 15000}
    ],
    "bus": [
        {"nombre": "buseta", "etiqueta": "Buseta", "precio_extra": 0},
        {"nombre": "microbus", "etiqueta": "Microbús +3k", "precio_extra": 3000},
        {"nombre": "bus", "etiqueta": "Bus +8k", "precio_extra": 8000},
        {"nombre": "articulado", "etiqueta": "Articulado +12k", "precio_extra": 12000}
    ],
    "furgon": [
        {"nombre": "pequeno", "etiqueta": "Pequeño", "precio_extra": 0},
        {"nombre": "mediano", "etiqueta": "Mediano +2k", "precio_extra": 2000},
        {"nombre": "grande", "etiqueta": "Grande +4k", "precio_extra": 4000},
        {"nombre": "refrigerado", "etiqueta": "Refrigerado +6k", "precio_extra": 6000}
    ]
}

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check if column exists
        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='vehiculos_catalogo' AND column_name='subcategorias'
            )
        """)
        
        if not exists:
            print("Añadiendo columna subcategorias JSONB a vehiculos_catalogo...")
            await conn.execute("ALTER TABLE vehiculos_catalogo ADD COLUMN subcategorias JSONB DEFAULT '[]'::jsonb")
        else:
            print("La columna subcategorias ya existe.")

        # Obtener vehiculos existentes y poblar
        vehiculos = await conn.fetch("SELECT id, nombre FROM vehiculos_catalogo")
        for v in vehiculos:
            tipo_l = v['nombre'].lower()
            if tipo_l in SUBCATEGORIAS_DEFAULT:
                subs_json = json.dumps(SUBCATEGORIAS_DEFAULT[tipo_l])
                await conn.execute("UPDATE vehiculos_catalogo SET subcategorias = $1::jsonb WHERE id = $2", subs_json, v['id'])
                print(f"Migrado: {v['nombre']}")
            else:
                print(f"Omitido (sin default): {v['nombre']}")

        print("Migración de base de datos completada exitosamente.")
    finally:
        await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
