import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def verificar_empleados():
    """Verificar la estructura exacta de la tabla empleados"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Verificar columnas de empleados
        print("\n=== COLUMNAS DE TABLA EMPLEADOS ===")
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'empleados' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        for col in columns:
            print(f"- {col['column_name']}: {col['data_type']} {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'} {col['column_default'] or ''}")
        
        # Verificar datos existentes
        print("\n=== DATOS EXISTENTES EN EMPLEADOS ===")
        
        # Intentar con diferentes columnas
        try:
            empleados = await conn.fetch("SELECT * FROM empleados ORDER BY id LIMIT 5")
            if empleados:
                print(f"Se encontraron {len(empleados)} empleados")
                for emp in empleados:
                    print(f"ID {emp['id']}: {dict(emp)}")
            else:
                print("No hay empleados registrados")
        except Exception as e:
            print(f"Error al consultar empleados: {e}")
        
        await conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verificar_empleados())
