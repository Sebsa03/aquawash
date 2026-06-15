import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from app.routers.auth import hashear_password
from app.config import settings

load_dotenv()

async def migrate_pins():
    print("Iniciando migración de PINs a bcrypt...")
    
    conn = await asyncpg.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432")
    )
    
    try:
        lavaderos = await conn.fetch("SELECT id, pin_dueno, pin_operario FROM lavaderos")
        count = 0
        
        for lavadero in lavaderos:
            pin_dueno = lavadero["pin_dueno"]
            pin_operario = lavadero["pin_operario"]
            
            # Solo hashear si no está hasheado ya (bcrypt hash starts with $2)
            update_needed = False
            new_dueno = pin_dueno
            new_operario = pin_operario
            
            if pin_dueno and not pin_dueno.startswith("$2"):
                new_dueno = hashear_password(pin_dueno.strip())
                update_needed = True
                
            if pin_operario and not pin_operario.startswith("$2"):
                new_operario = hashear_password(pin_operario.strip())
                update_needed = True
                
            if update_needed:
                await conn.execute(
                    "UPDATE lavaderos SET pin_dueno = $1, pin_operario = $2 WHERE id = $3",
                    new_dueno, new_operario, lavadero["id"]
                )
                count += 1
                
        print(f"Migración completada. {count} lavaderos actualizados.")
    except Exception as e:
        print(f"Error durante migración: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_pins())
