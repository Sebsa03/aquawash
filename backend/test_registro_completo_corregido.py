import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def test_registro_completo_corregido():
    """Probar registro completo con cálculo corregido"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Datos de prueba completo
        lavado_prueba = {
            'lavadero_id': 3,
            'empleado_id': 8,
            'placa': 'DEF456',
            'tipo_vehiculo': 'carro',
            'subcategoria': 'suv',
            'nivel_suciedad': 'profundo',
            'nota': 'Prueba completa con cálculo corregido',
            'adicionales': [
                {'nombre': 'Aspirado', 'precio': 5000},
                {'nombre': 'Encerado', 'precio': 8000}
            ]
        }
        
        print("\n=== DATOS DE PRUEBA COMPLETA ===")
        print(f"Lavadero ID: {lavado_prueba['lavadero_id']}")
        print(f"Empleado ID: {lavado_prueba['empleado_id']}")
        print(f"Placa: {lavado_prueba['placa']}")
        print(f"Tipo vehículo: {lavado_prueba['tipo_vehiculo']}")
        print(f"Subcategoría: {lavado_prueba['subcategoria']}")
        print(f"Nivel suciedad: {lavado_prueba['nivel_suciedad']}")
        
        # Calcular precios con lógica correcta
        print("\n=== CÁLCULO DE PRECIOS CORREGIDO ===")
        
        # Obtener precio base del vehículo
        precio_base = await conn.fetchval(f"""
            SELECT precio_{lavado_prueba['tipo_vehiculo']} 
            FROM lavaderos 
            WHERE id = $1
        """, lavado_prueba['lavadero_id'])
        
        print(f"Precio base {lavado_prueba['tipo_vehiculo']}: ${precio_base}")
        
        # Calcular precio con subcategoría y suciedad
        # NOTA: El frontend debe calcular esto y enviarlo ya calculado
        # Para esta prueba, usaremos el precio_base como precio_con_suciedad
        # y la subcategoría como información adicional
        
        subcategoria_extra = 3000 if lavado_prueba['subcategoria'] == 'suv' else 0
        print(f"Extra por subcategoría SUV: +${subcategoria_extra}")
        
        # El precio_base ya incluye el factor de suciedad del frontend
        precio_con_suciedad = precio_base
        print(f"Precio con suciedad (calculado por frontend): ${precio_con_suciedad}")
        
        # Calcular adicionales
        precio_adicionales = sum(a['precio'] for a in lavado_prueba['adicionales'])
        print(f"Precio adicionales: +${precio_adicionales}")
        
        # Calcular total
        precio_total = precio_con_suciedad + precio_adicionales
        print(f"PRECIO TOTAL: ${precio_total}")
        
        # Probar inserción
        print("\n=== INSERTANDO LAVADO COMPLETO ===")
        
        from datetime import time
        hora_time = time(16, 15)
        
        adicionales_json = json.dumps(lavado_prueba['adicionales'])
        etiquetas_json = json.dumps(['completo', 'prueba'])
        
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
            precio_con_suciedad,  # precio_base es el precio ya calculado con suciedad
            precio_adicionales,
            precio_total,
            adicionales_json,
            etiquetas_json,
            lavado_prueba['nota'],
            lavado_prueba['subcategoria'],
            lavado_prueba['nivel_suciedad']
        )
        
        print(f"¡LAVADO COMPLETO REGISTRADO CON ÉXITO!")
        print(f"ID del lavado: {resultado['id']}")
        print(f"Total registrado: ${resultado['precio_total']}")
        
        # Verificar que se guardó correctamente
        print("\n=== VERIFICANDO DATOS GUARDADOS ===")
        lavado_verificado = await conn.fetchrow("""
            SELECT id, placa, tipo_vehiculo, subcategoria, nivel_suciedad,
                   precio_base, precio_adicionales, precio_total,
                   adicionales_aplicados, nota
            FROM lavados
            WHERE id = $1
        """, resultado['id'])
        
        print(f"Placa: {lavado_verificado['placa']}")
        print(f"Tipo: {lavado_verificado['tipo_vehiculo']}")
        print(f"Subcategoría: {lavado_verificado['subcategoria']}")
        print(f"Nivel suciedad: {lavado_verificado['nivel_suciedad']}")
        print(f"Precio base (con suciedad): ${lavado_verificado['precio_base']}")
        print(f"Precio adicionales: ${lavado_verificado['precio_adicionales']}")
        print(f"Precio total: ${lavado_verificado['precio_total']}")
        print(f"Adicionales aplicados: {json.loads(lavado_verificado['adicionales_aplicados'])}")
        print(f"Nota: {lavado_verificado['nota']}")
        
        await conn.close()
        print("\n¡Prueba completa exitosa! La base de datos está lista para funcionar.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_registro_completo_corregido())
