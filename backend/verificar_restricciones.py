import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def verificar_restricciones():
    """Verificar las restricciones de la tabla lavados"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Verificar restricciones de la tabla lavados
        print("\n=== RESTRICCIONES DE TABLA LAVADOS ===")
        constraints = await conn.fetch("""
            SELECT conname, contype, conbin
            FROM pg_constraint
            WHERE conrelid = 'lavados'::regclass
            ORDER BY conname
        """)
        
        for constraint in constraints:
            print(f"Nombre: {constraint['conname']}")
            print(f"Tipo: {constraint['contype']}")
            print(f"Definición: {constraint['conbin']}")
            print("-" * 50)
        
        await conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verificar_restricciones())
