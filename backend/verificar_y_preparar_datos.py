import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def verificar_y_preparar():
    """Verificar y preparar datos necesarios para el funcionamiento"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Verificar y preparar empleados
        print("\n=== VERIFICANDO EMPLEADOS ===")
        empleados = await conn.fetch("SELECT id, nombre, lavadero_id, activo FROM empleados WHERE activo = true ORDER BY id")
        
        if empleados:
            print(f"Se encontraron {len(empleados)} empleados activos:")
            for emp in empleados:
                print(f"  ID {emp['id']}: {emp['nombre']} (Lavadero {emp['lavadero_id']})")
        
        # Verificar y preparar adicionales
        print("\n=== VERIFICANDO ADICIONALES ===")
        adicionales = await conn.fetch("SELECT id, nombre, precio FROM adicionales_catalogo ORDER BY id")
        
        if adicionales:
            print(f"Se encontraron {len(adicionales)} adicionales:")
            for add in adicionales:
                print(f"  ID {add['id']}: {add['nombre']} - ${add['precio']}")
        else:
            print("No hay adicionales registrados. Creando datos de prueba...")
            await crear_adicionales_prueba(conn)
        
        # Verificar lavaderos activos
        print("\n=== VERIFICANDO LAVADEROS ===")
        lavaderos = await conn.fetch("SELECT id, nombre, estado_suscripcion FROM lavaderos WHERE estado_suscripcion = 'trial' ORDER BY id")
        
        if lavaderos:
            print(f"Se encontraron {len(lavaderos)} lavaderos en trial:")
            for lav in lavaderos:
                print(f"  ID {lav['id']}: {lav['nombre']} - {lav['estado_suscripcion']}")
        
        # Verificar precios de lavaderos
        print("\n=== VERIFICANDO PRECIOS DE LAVADEROS ===")
        for lav in lavaderos:
            precios = await conn.fetchrow("""
                SELECT precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus
                FROM lavaderos WHERE id = $1
            """, lav['id'])
            
            print(f"Lavadero {lav['id']} ({lav['nombre']}):")
            print(f"  Moto: ${precios['precio_moto']}, Carro: ${precios['precio_carro']}, Furgón: ${precios['precio_furgon']}")
            print(f"  Camión: ${precios['precio_camion']}, Bus: ${precios['precio_bus']}")
        
        await conn.close()
        print("\nVerificación completada - La base de datos está lista para funcionar")
        
    except Exception as e:
        print(f"Error: {e}")

async def crear_adicionales_prueba(conn):
    """Crear adicionales de prueba si no existen"""
    adicionales_prueba = [
        ("Aspirado Premium", 5000, "Aspirado profundo con filtro HEPA"),
        ("Cera Premium", 8000, "Cera de alta calidad con protección UV"),
        ("Limpieza de Motor", 12000, "Limpieza completa del motor"),
        ("Tratamiento de Gomas", 3000, "Aplicación de protector en gomas"),
        ("Desengrasante Chasis", 4000, "Desengrasante completo del chasis"),
        ("Pulido Faros", 6000, "Pulido y restauración de faros"),
        ("Impermeabilización", 10000, "Protección contra la humedad"),
        ("Eliminación Olores", 7000, "Tratamiento de ozono para eliminar olores")
    ]
    
    for nombre, precio, descripcion in adicionales_prueba:
        await conn.execute("""
            INSERT INTO adicionales_catalogo (nombre, precio, descripcion)
            VALUES ($1, $2, $3)
        """, nombre, precio, descripcion)
        print(f"  Creado adicional: {nombre} - ${precio}")

if __name__ == "__main__":
    asyncio.run(verificar_y_preparar())
