import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def test_registro_completo():
    """Probar el registro completo de lavados con todas las características"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        print("Conectado a la base de datos")
        
        # Datos de prueba para un lavado completo
        lavado_prueba = {
            'lavadero_id': 3,
            'empleado_id': 8,
            'placa': 'ABC123',
            'tipo_vehiculo': 'carro',
            'subcategoria': 'suv',
            'nivel_suciedad': 'profundo',
            'hora_ingreso': '14:30:00',
            'nota': 'Cliente VIP - vehículo particular',
            'adicionales': [
                {'nombre': 'Aspirado', 'precio': 5000},
                {'nombre': 'Encerado', 'precio': 8000},
                {'nombre': 'Ambientador', 'precio': 3000}
            ]
        }
        
        print("\n=== DATOS DE PRUEBA ===")
        print(f"Lavadero ID: {lavado_prueba['lavadero_id']}")
        print(f"Empleado ID: {lavado_prueba['empleado_id']}")
        print(f"Placa: {lavado_prueba['placa']}")
        print(f"Tipo vehículo: {lavado_prueba['tipo_vehiculo']}")
        print(f"Subcategoría: {lavado_prueba['subcategoria']}")
        print(f"Nivel suciedad: {lavado_prueba['nivel_suciedad']}")
        print(f"Hora: {lavado_prueba['hora_ingreso']}")
        print(f"Nota: {lavado_prueba['nota']}")
        print(f"Adicionales: {len(lavado_prueba['adicionales'])} servicios")
        
        # Calcular precios
        print("\n=== CÁLCULO DE PRECIOS ===")
        
        # Obtener precio base del vehículo
        precio_base = await conn.fetchval(f"""
            SELECT precio_{lavado_prueba['tipo_vehiculo']} 
            FROM lavaderos 
            WHERE id = $1
        """, lavado_prueba['lavadero_id'])
        
        print(f"Precio base {lavado_prueba['tipo_vehiculo']}: ${precio_base}")
        
        # Calcular extra por subcategoría
        subcategoria_extra = 0
        if lavado_prueba['subcategoria'] == 'suv':
            subcategoria_extra = 3000
        print(f"Extra por subcategoría SUV: +${subcategoria_extra}")
        
        # Calcular factor por nivel de suciedad
        factores = {'ligero': 1.0, 'medio': 1.3, 'profundo': 1.6}
        factor_suciedad = factores.get(lavado_prueba['nivel_suciedad'], 1.0)
        print(f"Factor por nivel {lavado_prueba['nivel_suciedad']}: x{factor_suciedad}")
        
        # Calcular precio con subcategoría
        precio_con_subcategoria = precio_base + subcategoria_extra
        print(f"Precio con subcategoría: ${precio_con_subcategoria}")
        
        # Calcular precio con suciedad
        precio_con_suciedad = int(precio_con_subcategoria * factor_suciedad)
        print(f"Precio con suciedad: ${precio_con_suciedad}")
        
        # Calcular adicionales
        precio_adicionales = sum(a['precio'] for a in lavado_prueba['adicionales'])
        print(f"Precio adicionales: +${precio_adicionales}")
        
        # Calcular total
        precio_total = precio_con_suciedad + precio_adicionales
        print(f"PRECIO TOTAL: ${precio_total}")
        
        # Probar inserción
        print("\n=== INSERTANDO LAVADO DE PRUEBA ===")
        
        adicionales_json = json.dumps(lavado_prueba['adicionales'])
        etiquetas_json = json.dumps(['nuevo', 'prueba'])
        
        # Convertir hora a formato time
        from datetime import time
        hora_time = time(14, 30)
        
        resultado = await conn.fetchrow("""
            INSERT INTO lavados (
                lavadero_id, empleado_id, placa, tipo_vehiculo,
                hora_ingreso, precio_base, precio_adicionales, precio_total,
                adicionales_aplicados, etiquetas_estado, nota,
                subcategoria, nivel_suciedad
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13)
            RETURNING *
        """, 
            lavado_prueba['lavadero_id'],
            lavado_prueba['empleado_id'],
            lavado_prueba['placa'].upper(),
            lavado_prueba['tipo_vehiculo'],
            hora_time,
            precio_base,
            precio_adicionales,
            precio_total,
            adicionales_json,
            etiquetas_json,
            lavado_prueba['nota'],
            lavado_prueba['subcategoria'],
            lavado_prueba['nivel_suciedad']
        )
        
        print(f"¡LAVADO REGISTRADO CON ÉXITO!")
        print(f"ID del lavado: {resultado['id']}")
        print(f"Fecha: {resultado['fecha']}")
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
        print(f"Precio base: ${lavado_verificado['precio_base']}")
        print(f"Precio adicionales: ${lavado_verificado['precio_adicionales']}")
        print(f"Precio total: ${lavado_verificado['precio_total']}")
        print(f"Adicionales aplicados: {json.loads(lavado_verificado['adicionales_aplicados'])}")
        print(f"Nota: {lavado_verificado['nota']}")
        
        await conn.close()
        print("\n¡Prueba completada exitosamente! La base de datos está lista para funcionar.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_registro_completo())
