import asyncio
import asyncpg
import re

async def run():
    conn = await asyncpg.connect('postgresql://postgres:2003@localhost:5432/lavadero')
    
    # Obtener todos los movimientos
    movs = await conn.fetch("SELECT id, motivo FROM movimientos_inventario WHERE tipo = 'consumo'")
    
    for m in movs:
        motivo = m["motivo"]
        # Buscar ID de lavado en el motivo viejo "Consumo aut. Lavado #120 - Placa PQ15Q"
        match = re.search(r'Lavado #(\d+)', motivo)
        if match:
            lavado_id = int(match.group(1))
            # Obtener tipo de vehiculo y placa
            lavado = await conn.fetchrow("SELECT tipo_vehiculo, placa FROM lavados WHERE id = $1", lavado_id)
            if lavado:
                nuevo_motivo = f"{lavado['tipo_vehiculo'].upper()} - {lavado['placa']}"
                await conn.execute("UPDATE movimientos_inventario SET motivo = $1 WHERE id = $2", nuevo_motivo, m["id"])
                print(f"Updated {m['id']}: {nuevo_motivo}")
    
    await conn.close()

asyncio.run(run())
