"""
check_triggers.py - Busca triggers, reglas y funciones que referencien precio_tipovehiculo
"""
import asyncio, asyncpg, os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:2003@localhost:5432/lavadero")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    print("CONECTADO OK")

    # Buscar en pg_proc (funciones/procedimientos)
    print("\n--- FUNCIONES ---")
    funcs = await conn.fetch("""
        SELECT proname, prosrc
        FROM pg_proc
        WHERE prosrc ILIKE '%precio_tipovehiculo%'
    """)
    print(f"Funciones encontradas: {len(funcs)}")
    for f in funcs:
        print(f"  Funcion: {f['proname']}")
        print(f"  Fuente: {f['prosrc'][:500]}")

    # Buscar en triggers
    print("\n--- TRIGGERS ---")
    triggers = await conn.fetch("""
        SELECT trigger_name, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    """)
    print(f"Triggers encontrados: {len(triggers)}")
    for t in triggers:
        print(f"  Trigger: {t['trigger_name']} en tabla {t['event_object_table']}")
        print(f"  Accion: {t['action_statement'][:300]}")

    # Buscar en reglas (rules)
    print("\n--- REGLAS ---")
    rules = await conn.fetch("""
        SELECT rulename, tablename, definition
        FROM pg_rules
        WHERE schemaname = 'public'
    """)
    print(f"Reglas encontradas: {len(rules)}")
    for r in rules:
        tiene = 'precio_tipovehiculo' in (r['definition'] or '').lower()
        print(f"  Regla: {r['rulename']} en {r['tablename']} - referencia_precio_tipovehiculo={tiene}")
        if tiene:
            print(f"  Def: {r['definition'][:500]}")

    # Verificar columnas de lavaderos
    print("\n--- COLUMNAS DE lavaderos ---")
    cols = await conn.fetch("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='lavaderos' AND column_name LIKE 'precio_%'
        ORDER BY ordinal_position
    """)
    for c in cols:
        print(f"  {c['column_name']}")

    # Verificar columnas de lavados
    print("\n--- COLUMNAS DE lavados ---")
    cols2 = await conn.fetch("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='lavados'
        ORDER BY ordinal_position
    """)
    for c in cols2:
        print(f"  {c['column_name']}")

    # Verificar tablas existentes
    print("\n--- TABLAS EXISTENTES ---")
    tablas = await conn.fetch("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' ORDER BY table_name
    """)
    for t in tablas:
        print(f"  {t['table_name']}")

    # Simular la query exacta del backend para ver el error
    print("\n--- SIMULAR QUERY DE LAVADOS.PY ---")
    try:
        result = await conn.fetchrow(
            "SELECT precio_carro AS precio_base FROM lavaderos WHERE id = $1",
            3
        )
        print(f"  Query correcta funciona: precio_base = {result['precio_base']}")
    except Exception as e:
        print(f"  ERROR en query correcta: {e}")

    # Probar query del endpoint de preparacion asyncpg
    print("\n--- PROBAR PREPARE ---")
    try:
        stmt = await conn.prepare(
            "SELECT precio_carro AS precio_base FROM lavaderos WHERE id = $1"
        )
        print("  PREPARE funciona OK")
    except Exception as e:
        print(f"  ERROR en PREPARE: {e}")

    await conn.close()
    print("\nFIN")

asyncio.run(main())
