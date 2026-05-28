import asyncio
import asyncpg
import os
import random
from datetime import date, timedelta, datetime
from dotenv import load_dotenv
from app.routers.auth import hashear_password

load_dotenv()

async def setup():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    # 1. Crear o buscar demo@aquawash.com
    email = "demo@aquawash.com"
    lavadero = await conn.fetchrow("SELECT id FROM lavaderos WHERE email = $1", email)
    if not lavadero:
        print("Creando cuenta demo...")
        lavadero_id = await conn.fetchval(
            """
            INSERT INTO lavaderos (
                nombre, ciudad, telefono, email, password_hash, plan, estado_suscripcion, trial_hasta,
                precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING id
            """,
            "Demo Lavadero", "Bogotá", "3000000000", email, hashear_password("demo1234"),
            "pro", "activa", date.today() + timedelta(days=365),
            10000, 15000, 20000, 25000, 30000
        )
        for nom, p in [("Aspirado",5000),("Encerado",8000),("Motor",12000),("Rines",6000)]:
            await conn.execute("INSERT INTO adicionales_catalogo (lavadero_id, nombre, precio) VALUES ($1,$2,$3)", lavadero_id, nom, p)
    else:
        lavadero_id = lavadero['id']
        print(f"Cuenta demo existe con ID {lavadero_id}. Limpiando datos antiguos...")
        await conn.execute("DELETE FROM lavados WHERE lavadero_id = $1", lavadero_id)
        await conn.execute("DELETE FROM empleados WHERE lavadero_id = $1", lavadero_id)
        
    print("Insertando empleados...")
    emp1 = await conn.fetchval("INSERT INTO empleados (lavadero_id, nombre) VALUES ($1,$2) RETURNING id", lavadero_id, "Carlos Martínez")
    emp2 = await conn.fetchval("INSERT INTO empleados (lavadero_id, nombre) VALUES ($1,$2) RETURNING id", lavadero_id, "Leo Torres")
    emp3 = await conn.fetchval("INSERT INTO empleados (lavadero_id, nombre) VALUES ($1,$2) RETURNING id", lavadero_id, "Andrés Gómez")
    
    print("Insertando historial de lavados (últimos 7 días)...")
    estados = ["espera", "lavando", "terminado", "entregado", "cancelado"]
    tipos = ["moto", "carro", "camion", "furgon"]
    placas = ["ABC-123", "XYZ-987", "MTO-001", "CAR-444", "RAP-555", "LOU-888", "RST-333"]
    
    # Generar ~35 lavados distribuidos en los ultimos 7 dias
    for i in range(35):
        dias_atr = random.randint(0, 6)
        dt = datetime.now() - timedelta(days=dias_atr)
        
        hora_i = dt.replace(hour=random.randint(8, 18), minute=random.randint(0, 59))
        
        estado = "entregado" if dias_atr > 0 else random.choice(["espera", "lavando", "terminado", "entregado", "entregado"])
        if random.random() < 0.05: estado = "cancelado"
        
        tipo = random.choice(tipos)
        precio_b = 15000 if tipo == "carro" else 10000 if tipo == "moto" else 20000
        
        placa = random.choice(placas) if random.random() > 0.4 else f"Z{random.randint(10,99)}-{random.randint(100,999)}"
        nombre = f"Cliente {random.randint(1,100)}" if random.random() > 0.5 else None
        
        emp_id = random.choice([emp1, emp2, emp3])
        
        await conn.execute(
            """
            INSERT INTO lavados (
                lavadero_id, placa, tipo_vehiculo, cliente_nombre, empleado_id,
                precio_base, precio_adicionales, precio_total, estado, 
                fecha, hora_ingreso, hora_entregado, adicionales_aplicados, etiquetas_estado
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb)
            """,
            lavadero_id, placa, tipo, nombre, emp_id,
            precio_b, 0, precio_b, estado, 
            hora_i.date(), hora_i.time(), 
            (hora_i + timedelta(minutes=45)).time() if estado in ["terminado", "entregado"] else None,
            "[]", "[]"
        )

    print("Demo data creada exitosamente.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(setup())
