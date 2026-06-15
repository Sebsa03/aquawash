import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from app.routers.auth import hashear_password
from app.config import settings

load_dotenv()

async def migrate_pins():
    print("Iniciando migración de PINs a bcrypt...")
    
    try:
        # Paso 1: Alterar la tabla en una conexión separada para evitar errores de caché en asyncpg
        conn_alter = await asyncpg.connect(settings.database_url)
        print("Ampliando columnas pin_dueno y pin_operario a VARCHAR(255)...")
        await conn_alter.execute("ALTER TABLE lavaderos ALTER COLUMN pin_dueno TYPE VARCHAR(255);")
        await conn_alter.execute("ALTER TABLE lavaderos ALTER COLUMN pin_operario TYPE VARCHAR(255);")
        await conn_alter.close()

        # Paso 2: Ejecutar la migración de datos
        conn = await asyncpg.connect(settings.database_url, statement_cache_size=0)
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
        await conn.close()
    except Exception as e:
        print(f"Error durante migración: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_pins())
