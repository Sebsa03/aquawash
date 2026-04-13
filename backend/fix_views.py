"""
fix_views.py
------------
Detecta las vistas/funciones de la BD que todavía referencian «precio_tipovehiculo»
(tabla que ya no existe) y las recrea correctamente.

Uso:
    cd backend
    python fix_views.py
"""
import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:2003@localhost:5432/lavadero")


async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    print("✅ Conectado a la base de datos\n")

    # ─── 1. Mostrar TODAS las vistas que referencian precio_tipovehiculo ─────
    print("=" * 60)
    print("PASO 1 — Vistas con referencia a precio_tipovehiculo")
    print("=" * 60)
    vistas = await conn.fetch("""
        SELECT viewname, definition
        FROM pg_views
        WHERE schemaname = 'public'
          AND definition ILIKE '%precio_tipovehiculo%'
    """)
    if not vistas:
        print("✔  Ninguna vista referencia precio_tipovehiculo directamente.")
    for v in vistas:
        print(f"\n  Vista afectada: {v['viewname']}")
        print(f"  Definición:\n{v['definition']}\n")

    # ─── 2. Mostrar funciones/triggers que referencian precio_tipovehiculo ───
    print("\n" + "=" * 60)
    print("PASO 2 — Funciones con referencia a precio_tipovehiculo")
    print("=" * 60)
    funcs = await conn.fetch("""
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_definition ILIKE '%precio_tipovehiculo%'
    """)
    if not funcs:
        print("✔  Ninguna función referencia precio_tipovehiculo.")
    for f in funcs:
        print(f"\n  Función afectada: {f['routine_name']}")
        print(f"  Definición:\n{f['routine_definition']}\n")

    # ─── 3. Verificar si `precio_tipovehiculo` todavía existe como tabla ─────
    print("\n" + "=" * 60)
    print("PASO 3 — ¿Existe la tabla precio_tipovehiculo?")
    print("=" * 60)
    existe = await conn.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'precio_tipovehiculo'
        )
    """)
    print(f"  {'SÍ existe (se debería eliminar)' if existe else '✔  NO existe (correcto)'}")

    # ─── 4. Eliminar las vistas problemáticas y recrearlas ───────────────────
    nombres_a_reparar = [v["viewname"] for v in vistas]

    if not nombres_a_reparar:
        print("\n✅ No hay vistas que reparar. El error debe venir de otro lugar.")
        print("   Revisa si el frontend está llamando a una URL externa o")
        print("   si hay una función almacenada (ver PASO 2).")
    else:
        print("\n" + "=" * 60)
        print("PASO 4 — Eliminando y recreando vistas problemáticas")
        print("=" * 60)

        # Eliminar las vistas detectadas
        for nombre in nombres_a_reparar:
            await conn.execute(f"DROP VIEW IF EXISTS {nombre} CASCADE")
            print(f"  🗑  DROP VIEW {nombre}")

        # Recrear v_estadisticas_hoy (sin precio_tipovehiculo)
        if "v_estadisticas_hoy" in nombres_a_reparar:
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
            print("  ✅ Vista v_estadisticas_hoy recreada correctamente")

        # Recrear v_resumen_placas (sin precio_tipovehiculo)
        if "v_resumen_placas" in nombres_a_reparar:
            await conn.execute("""
                CREATE OR REPLACE VIEW v_resumen_placas AS
                SELECT
                    lavadero_id,
                    placa,
                    tipo_vehiculo,
                    COUNT(*)                            AS total_lavados,
                    COALESCE(SUM(precio_total), 0)      AS total_ingresos,
                    MAX(fecha)                          AS ultima_visita
                FROM lavados
                GROUP BY lavadero_id, placa, tipo_vehiculo
            """)
            print("  ✅ Vista v_resumen_placas recreada correctamente")

        print("\n✅ Reparación completada. El error UndefinedTableError debería desaparecer.")

    # ─── 5. Verificar columnas de la tabla lavaderos ─────────────────────────
    print("\n" + "=" * 60)
    print("PASO 5 — Columnas actuales de `lavaderos`")
    print("=" * 60)
    cols = await conn.fetch("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'lavaderos'
        ORDER BY ordinal_position
    """)
    for c in cols:
        print(f"  {c['column_name']:30s} {c['data_type']}")

    # ─── 6. Verificar columnas de la tabla `lavados` ──────────────────────────
    print("\n" + "=" * 60)
    print("PASO 6 — Columnas actuales de `lavados`")
    print("=" * 60)
    cols2 = await conn.fetch("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'lavados'
        ORDER BY ordinal_position
    """)
    for c in cols2:
        print(f"  {c['column_name']:30s} {c['data_type']}")

    await conn.close()
    print("\n🏁 Script finalizado.")


if __name__ == "__main__":
    asyncio.run(main())
