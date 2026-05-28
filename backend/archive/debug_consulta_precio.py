import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_consulta_precio():
    """Debug de la consulta de precios que está fallando"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Probar la consulta exacta del backend
        print("\n=== PROBANDO CONSULTA DE PRECIOS ===")
        
        # Consulta del backend (líneas 22-26 de lavados.py)
        tipo_vehiculo = "carro"
        lavadero_id = 3
        
        print(f"Tipo vehículo: {tipo_vehiculo}")
        print(f"Lavadero ID: {lavadero_id}")
        
        try:
            precios = await conn.fetchrow(
                f"SELECT precio_{tipo_vehiculo} AS precio_base "
                f"FROM lavaderos WHERE id = $1",
                lavadero_id
            )
            
            print(f"Consulta exitosa: {precios}")
            print(f"Precio base: {precios['precio_base']}")
            
        except Exception as e:
            print(f"Error en consulta: {e}")
        
        # Probar consulta directa sin f-string
        print("\n=== PROBANDO CONSULTA DIRECTA ===")
        try:
            precios = await conn.fetchrow(
                "SELECT precio_carro AS precio_base FROM lavaderos WHERE id = $1",
                lavadero_id
            )
            
            print(f"Consulta directa exitosa: {precios}")
            print(f"Precio base: {precios['precio_base']}")
            
        except Exception as e:
            print(f"Error en consulta directa: {e}")
        
        # Probar consulta que podría estar fallando
        print("\n=== PROBANDO CONSULTA CON ERROR ===")
        try:
            # Esta es la consulta que podría estar causando el error
            resultado = await conn.fetchrow(
                "SELECT * FROM precio_tipovehiculo WHERE tipo_vehiculo = $1",
                tipo_vehiculo
            )
            
            print(f"Consulta a precio_tipovehiculo: {resultado}")
            
        except Exception as e:
            print(f"Error en consulta a precio_tipovehiculo: {e}")
            print("Esta es la consulta que está causando el error!")
        
        # Verificar si la tabla existe
        print("\n=== VERIFICANDO SI EXISTE LA TABLA ===")
        try:
            tablas = await conn.fetch(
                "SELECT table_name FROM information_schema.tables WHERE table_name = 'precio_tipovehiculo'"
            )
            
            if tablas:
                print("La tabla precio_tipovehiculo SÍ existe")
                print(f"Tablas encontradas: {tablas}")
            else:
                print("La tabla precio_tipovehiculo NO existe")
                
        except Exception as e:
            print(f"Error verificando tabla: {e}")
        
        await conn.close()
        
    except Exception as e:
        print(f"Error general: {e}")

if __name__ == "__main__":
    asyncio.run(debug_consulta_precio())
