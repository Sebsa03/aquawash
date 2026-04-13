import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def test_registro_simple():
    """Probar registro simple sin subcategorías ni suciedad"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Datos de prueba simple
        lavado_prueba = {
            'lavadero_id': 3,
            'empleado_id': 8,
            'placa': 'XYZ789',
            'tipo_vehiculo': 'carro',
            'subcategoria': None,  # Sin subcategoría
            'nivel_suciedad': 'ligero',  # Nivel simple
            'nota': 'Prueba simple',
            'adicionales': []  # Sin adicionales
        }
        
        print("\n=== DATOS DE PRUEBA SIMPLE ===")
        print(f"Lavadero ID: {lavado_prueba['lavadero_id']}")
        print(f"Empleado ID: {lavado_prueba['empleado_id']}")
        print(f"Placa: {lavado_prueba['placa']}")
        print(f"Tipo vehículo: {lavado_prueba['tipo_vehiculo']}")
        print(f"Subcategoría: {lavado_prueba['subcategoria']}")
        print(f"Nivel suciedad: {lavado_prueba['nivel_suciedad']}")
        
        # Calcular precios simples
        print("\n=== CÁLCULO DE PRECIOS SIMPLE ===")
        
        # Obtener precio base del vehículo
        precio_base = await conn.fetchval(f"""
            SELECT precio_{lavado_prueba['tipo_vehiculo']} 
            FROM lavaderos 
            WHERE id = $1
        """, lavado_prueba['lavadero_id'])
        
        print(f"Precio base {lavado_prueba['tipo_vehiculo']}: ${precio_base}")
        
        # Sin subcategoría ni adicionales
        subcategoria_extra = 0
        precio_adicionales = 0
        
        # Factor simple para nivel ligero
        factor_suciedad = 1.0
        precio_con_suciedad = int(precio_base * factor_suciedad)
        precio_total = precio_con_suciedad + precio_adicionales
        
        print(f"Precio con suciedad: ${precio_con_suciedad}")
        print(f"Precio adicionales: +${precio_adicionales}")
        print(f"PRECIO TOTAL: ${precio_total}")
        
        # Probar inserción simple
        print("\n=== INSERTANDO LAVADO SIMPLE ===")
        
        from datetime import time
        hora_time = time(15, 0)
        
        resultado = await conn.fetchrow("""
            INSERT INTO lavados (
                lavadero_id, empleado_id, placa, tipo_vehiculo,
                hora_ingreso, precio_base, precio_adicionales, precio_total,
                adicionales_aplicados, etiquetas_estado, nota,
                subcategoria, nivel_suciedad
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13)
            RETURNING id, precio_total
        """, 
            lavado_prueba['lavadero_id'],
            lavado_prueba['empleado_id'],
            lavado_prueba['placa'].upper(),
            lavado_prueba['tipo_vehiculo'],
            hora_time,
            precio_base,
            precio_adicionales,
            precio_total,
            '[]',
            '[]',
            lavado_prueba['nota'],
            lavado_prueba['subcategoria'],
            lavado_prueba['nivel_suciedad']
        )
        
        print(f"¡LAVADO SIMPLE REGISTRADO CON ÉXITO!")
        print(f"ID del lavado: {resultado['id']}")
        print(f"Total registrado: ${resultado['precio_total']}")
        
        await conn.close()
        print("\n¡Prueba simple completada exitosamente!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_registro_simple())
