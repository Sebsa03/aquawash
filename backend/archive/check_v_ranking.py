"""
check_v_ranking.py - Chequea la definicion de v_ranking_empleados
"""
import asyncio, asyncpg, os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:2003@localhost:5432/lavadero")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    print("CONECTADO OK")

    # Ver definicion completa de todas las vistas
    vistas = await conn.fetch("""
        SELECT viewname, definition
        FROM pg_views
        WHERE schemaname = 'public'
        ORDER BY viewname
    """)
    for v in vistas:
        print(f"\n=== VISTA: {v['viewname']} ===")
        print(v['definition'])

    # Intentar SELECT en cada vista para detectar errores
    for v in vistas:
        nombre = v['viewname']
        try:
            await conn.fetch(f"SELECT * FROM {nombre} LIMIT 1")
            print(f"\n[OK] SELECT FROM {nombre}")
        except Exception as e:
            print(f"\n[ERROR] SELECT FROM {nombre}: {e}")

    await conn.close()
    print("\nFIN")

asyncio.run(main())
