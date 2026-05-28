import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def verificar_estructura():
    """Verificar la estructura actual de la base de datos"""
    try:
        # Conectar a la base de datos
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Verificar tablas existentes
        print("\n=== TABLAS EXISTENTES ===")
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        for table in tables:
            print(f"- {table['table_name']}")
        
        # Verificar columnas de la tabla lavados
        print("\n=== COLUMNAS DE TABLA LAVADOS ===")
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'lavados' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        for col in columns:
            print(f"- {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'} {col['column_default'] or ''}")
        
        # Verificar columnas de la tabla lavaderos
        print("\n=== COLUMNAS DE TABLA LAVADEROS ===")
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'lavaderos' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        for col in columns:
            print(f"- {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'} {col['column_default'] or ''}")
        
        # Verificar si existen las nuevas columnas en lavados
        print("\n=== VERIFICACIÓN DE COLUMNAS NUEVAS ===")
        nuevas_columnas = ['subcategoria', 'nivel_suciedad']
        
        for col in nuevas_columnas:
            result = await conn.fetchval("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'lavados' AND column_name = $1
            """, col)
            
            if result > 0:
                print(f"Columna '{col}' ya existe en la tabla lavados")
            else:
                print(f"Columna '{col}' NO existe en la tabla lavados - NECESITA MIGRACIÓN")
        
        # Verificar datos existentes en lavaderos
        print("\n=== DATOS EXISTENTES EN LAVADEROS ===")
        lavaderos = await conn.fetch("""
            SELECT id, nombre, precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus
            FROM lavaderos
            ORDER BY id
        """)
        
        for lavadero in lavaderos:
            print(f"ID {lavadero['id']}: {lavadero['nombre']}")
            print(f"  Precios: moto=${lavadero['precio_moto']}, carro=${lavadero['precio_carro']}, furgon=${lavadero['precio_furgon']}")
            print(f"           camion={lavadero['precio_camion']}, bus={lavadero['precio_bus']}")
        
        await conn.close()
        print("\nVerificación completada")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verificar_estructura())
