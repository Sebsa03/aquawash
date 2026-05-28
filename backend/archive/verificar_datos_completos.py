import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def verificar_datos():
    """Verificar los datos necesarios para el funcionamiento"""
    try:
        # Conectar a la base de datos
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Verificar empleados
        print("\n=== EMPLEADOS EXISTENTES ===")
        empleados = await conn.fetch("""
            SELECT id, nombre, rol
            FROM empleados
            ORDER BY id
        """)
        
        if empleados:
            for emp in empleados:
                print(f"ID {emp['id']}: {emp['nombre']} - {emp['rol']}")
        else:
            print("No hay empleados registrados")
        
        # Verificar adicionales
        print("\n=== ADICIONALES EXISTENTES ===")
        adicionales = await conn.fetch("""
            SELECT id, nombre, precio, descripcion
            FROM adicionales_catalogo
            ORDER BY id
        """)
        
        if adicionales:
            for add in adicionales:
                print(f"ID {add['id']}: {add['nombre']} - ${add['precio']} - {add['descripcion']}")
        else:
            print("No hay adicionales registrados")
        
        # Verificar vehículos catalogo
        print("\n=== VEHÍCULOS CATALOGO ===")
        vehiculos = await conn.fetch("""
            SELECT tipo_vehiculo, nombre, descripcion
            FROM vehiculos_catalogo
            ORDER BY tipo_vehiculo
        """)
        
        if vehiculos:
            for veh in vehiculos:
                print(f"{veh['tipo_vehiculo']}: {veh['nombre']} - {veh['descripcion']}")
        else:
            print("No hay vehículos en el catálogo")
        
        # Verificar cambios de estado
        print("\n=== CAMBIOS DE ESTADO ===")
        cambios = await conn.fetch("""
            SELECT nombre, color, icono
            FROM cambios_estado
            ORDER BY id
        """)
        
        if cambios:
            for cambio in cambios:
                print(f"{cambio['nombre']}: {cambio['color']} - {cambio['icono']}")
        else:
            print("No hay cambios de estado registrados")
        
        # Verificar planes disponibles
        print("\n=== PLANES DISPONIBLES ===")
        planes = await conn.fetch("""
            SELECT unnest(enum_range(NULL, 'basico', 'pro', 'premium')) AS plan
        """)
        
        for plan in planes:
            print(f"- {plan['plan']}")
        
        await conn.close()
        print("\nVerificación de datos completada")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verificar_datos())
