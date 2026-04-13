import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_login():
    """Probar login y obtener token"""
    try:
        import requests
        
        # Datos de login de prueba
        login_data = {
            "email": "sebas@example.com",  # Email de prueba
            "password": "password123"
        }
        
        print("=== INTENTANDO LOGIN ===")
        print(f"Email: {login_data['email']}")
        print(f"Password: {login_data['password']}")
        
        # Intentar login
        response = requests.post(
            "http://127.0.0.1:8000/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            print(f"¡LOGIN EXITOSO!")
            print(f"Token: {token_data['access_token'][:50]}...")
            
            # Guardar token para pruebas
            with open("token_test.txt", "w") as f:
                f.write(token_data['access_token'])
            print("Token guardado en token_test.txt")
            
            # Probar endpoint con token
            print("\n=== PROBANDO ENDPOINT CON TOKEN ===")
            headers = {
                "Authorization": f"Bearer {token_data['access_token']}",
                "Content-Type": "application/json"
            }
            
            # Probar obtener empleados
            empleados_response = requests.get(
                "http://127.0.0.1:8000/empleados/",
                headers=headers
            )
            
            print(f"Empleados Status: {empleados_response.status_code}")
            if empleados_response.status_code == 200:
                empleados = empleados_response.json()
                print(f"Empleados encontrados: {len(empleados)}")
                for emp in empleados[:3]:  # Mostrar primeros 3
                    print(f"  - {emp['nombre']} (ID: {emp['id']})")
            
            # Probar obtener adicionales
            adicionales_response = requests.get(
                "http://127.0.0.1:8000/adicionales/",
                headers=headers
            )
            
            print(f"Adicionales Status: {adicionales_response.status_code}")
            if adicionales_response.status_code == 200:
                adicionales = adicionales_response.json()
                print(f"Adicionales encontrados: {len(adicionales)}")
                for add in adicionales[:3]:  # Mostrar primeros 3
                    print(f"  - {add['nombre']} - ${add['precio']}")
            
        else:
            print("LOGIN FALLIDO - Intentando crear usuario de prueba...")
            
            # Intentar registro
            registro_data = {
                "nombre": "Usuario Prueba",
                "email": "test@example.com",
                "password": "test123",
                "plan": "basico"
            }
            
            print(f"\n=== CREANDO USUARIO DE PRUEBA ===")
            print(f"Email: {registro_data['email']}")
            print(f"Password: {registro_data['password']}")
            
            registro_response = requests.post(
                "http://127.0.0.1:8000/auth/registro",
                json=registro_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Registro Status: {registro_response.status_code}")
            print(f"Registro Response: {registro_response.text}")
            
            if registro_response.status_code == 201:
                token_data = registro_response.json()
                print(f"¡REGISTRO Y LOGIN EXITOSOS!")
                print(f"Token: {token_data['access_token'][:50]}...")
                
                # Guardar token
                with open("token_test.txt", "w") as f:
                    f.write(token_data['access_token'])
                print("Token guardado en token_test.txt")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
