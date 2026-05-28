import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def verificar_vistas():
    """Verificar si hay vistas que usen precio_tipovehiculo"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Verificar vistas existentes
        print("\n=== VISTAS EXISTENTES ===")
        views = await conn.fetch("""
            SELECT table_name, view_definition
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        for view in views:
            print(f"\n--- VISTA: {view['table_name']} ---")
            definicion = view['view_definition']
            print(f"Definición: {definicion}")
            
            if 'precio_tipovehiculo' in definicion.lower():
                print("¡¡¡¡ ESTA VISTA CONTIENE precio_tipovehiculo !!!")
        
        # Verificar funciones
        print("\n=== FUNCIONES EXISTENTES ===")
        functions = await conn.fetch("""
            SELECT proname, prosrc
            FROM pg_proc
            WHERE pronamespace = 'public'
            ORDER BY proname
        """)
        
        for func in functions:
            print(f"\n--- FUNCIÓN: {func['proname']} ---")
            fuente = func['prosrc']
            print(f"Fuente: {fuente}")
            
            if 'precio_tipovehiculo' in fuente.lower():
                print("¡¡¡¡ ESTA FUNCIÓN CONTIENE precio_tipovehiculo !!!")
        
        await conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verificar_vistas())
