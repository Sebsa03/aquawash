"""
check_db.py  -- sin emojis para evitar errores de encoding
"""
import asyncio, asyncpg, os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:2003@localhost:5432/lavadero")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    print("CONECTADO OK")

    # Vistas que referencian precio_tipovehiculo
    vistas = await conn.fetch("""
        SELECT viewname, definition
        FROM pg_views
        WHERE schemaname = 'public'
          AND definition ILIKE '%precio_tipovehiculo%'
    """)
    print(f"\nVistas con precio_tipovehiculo: {len(vistas)}")
    for v in vistas:
        print(f"  VISTA: {v['viewname']}")
        print(f"  DEF: {v['definition'][:300]}")

    # Tabla precio_tipovehiculo existe?
    existe = await conn.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name='precio_tipovehiculo'
        )
    """)
    print(f"\nTabla precio_tipovehiculo existe: {existe}")

    # Si hay vistas rotas, repararlas
    if vistas:
        print("\nREPARANDO VISTAS...")
        for v in vistas:
            nombre = v['viewname']
            await conn.execute(f"DROP VIEW IF EXISTS {nombre} CASCADE")
            print(f"  DROP VIEW {nombre} - OK")

        # Recrear v_estadisticas_hoy
        await conn.execute("""
            CREATE OR REPLACE VIEW v_estadisticas_hoy AS
            SELECT
                lavadero_id,
                COUNT(*)                             AS vehiculos_hoy,
                COALESCE(SUM(precio_total), 0)       AS ingresos_hoy,
                COALESCE(SUM(precio_adicionales), 0) AS adicionales_hoy,
                COALESCE(AVG(precio_total), 0)       AS promedio_hoy
            FROM lavados
            WHERE fecha = CURRENT_DATE
            GROUP BY lavadero_id
        """)
        print("  CREATE VIEW v_estadisticas_hoy - OK")

        # Recrear v_resumen_placas
        await conn.execute("""
            CREATE OR REPLACE VIEW v_resumen_placas AS
            SELECT
                lavadero_id,
                placa,
                tipo_vehiculo,
                COUNT(*)                       AS total_lavados,
                COALESCE(SUM(precio_total), 0) AS total_ingresos,
                MAX(fecha)                     AS ultima_visita
            FROM lavados
            GROUP BY lavadero_id, placa, tipo_vehiculo
        """)
        print("  CREATE VIEW v_resumen_placas - OK")
        print("\nREPARACION COMPLETADA")
    else:
        print("\nNo hay vistas rotas. El error puede venir de otro origen.")
        print("Revisa si la tabla vehiculos_catalogo existe:")
        cat = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema='public' AND table_name='vehiculos_catalogo'
            )
        """)
        print(f"  vehiculos_catalogo existe: {cat}")

    # Verificar vistas ahora
    print("\nVistas actuales en la BD:")
    todas = await conn.fetch("""
        SELECT viewname FROM pg_views WHERE schemaname='public' ORDER BY viewname
    """)
    for v in todas:
        print(f"  {v['viewname']}")

    await conn.close()
    print("\nFIN")

asyncio.run(main())
