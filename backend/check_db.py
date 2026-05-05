import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:2003@localhost:5432/lavadero')
    print("--- RECETAS ---")
    rows = await conn.fetch("SELECT * FROM recetas")
    for r in rows: print(dict(r))
    
    print("--- MOVIMIENTOS ---")
    rows = await conn.fetch("SELECT * FROM movimientos_inventario")
    for r in rows: print(dict(r))
    
    print("--- LAVADOS ---")
    rows = await conn.fetch("SELECT id, placa, tipo_vehiculo, subcategoria, estado_actual, adicionales_aplicados FROM lavados ORDER BY id DESC LIMIT 5")
    for r in rows: print(dict(r))
    
    await conn.close()

asyncio.run(run())
