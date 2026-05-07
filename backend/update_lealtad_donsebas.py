import asyncio
import os
import asyncpg
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import date, timedelta

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_db():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Falta DATABASE_URL")
        return

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Añadir meta_lealtad
        await conn.execute("""
            ALTER TABLE lavaderos
            ADD COLUMN IF NOT EXISTS meta_lealtad INTEGER DEFAULT 5;
        """)
        print("Columna meta_lealtad verificada/añadida.")

        # Verificar si existe un lavadero, sino crearlo (para donsebas)
        existe = await conn.fetchval("SELECT id FROM lavaderos WHERE email = 'donsebas@aquawash.com'")
        if not existe:
            hash_pw = pwd_context.hash("123456")
            trial = date.today() + timedelta(days=365)
            await conn.execute(
                """
                INSERT INTO lavaderos (
                    nombre, ciudad, telefono, email, password_hash, plan, estado_suscripcion, trial_hasta
                ) VALUES (
                    'Lavadero Don Sebas', 'Bogotá', '3000000000', 'donsebas@aquawash.com', $1, 'pro', 'activo', $2
                )
                """, hash_pw, trial
            )
            print("Inquilino Don Sebas creado (email: donsebas@aquawash.com, pw: 123456)")
        else:
            print("Inquilino Don Sebas ya existía.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(update_db())
