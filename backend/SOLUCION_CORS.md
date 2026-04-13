# Solución al Problema de CORS - AquaWash

## Problema Identificado

El error de CORS que mencionas:
```
Access to fetch at 'http://127.0.0.1:8000/lavados/' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**NO es un problema de CORS** - es un problema de **autenticación**.

## Estado Actual del Backend

### 1. **CORS Configurado Correctamente** 
```python
# En app/main.py - Líneas 8-14
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. **Servidor Backend Corriendo**
- **URL**: http://127.0.0.1:8000
- **Status**: Activo y funcionando
- **CORS**: Permitiendo todos los orígenes

### 3. **Endpoints Disponibles**
- **GET /**: `{"mensaje": "AquaWash API funcionando"}` - Funciona
- **GET /lavados/**: `{"detail": "Not authenticated"}` - Requiere autenticación
- **POST /auth/login**: Funciona
- **POST /auth/registro**: Funciona

## Solución Real: Autenticación

### 1. **Usuario de Prueba Creado**
```json
{
  "email": "test@example.com",
  "password": "test123"
}
```

### 2. **Token de Acceso Disponible**
- Guardado en `token_test.txt`
- Válido para 8 horas (480 minutos)

### 3. **Flujo Correcto del Frontend**

#### Paso 1: Login
```
POST http://127.0.0.1:8000/auth/login
{
  "email": "test@example.com",
  "password": "test123"
}
```

#### Paso 2: Obtener Token
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### Paso 3: Acceder a Endpoints Protegidos
```
GET http://127.0.0.1:8000/lavados/
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Instrucciones para el Frontend

### 1. **Ir a la página de login**
- URL: `http://localhost:5173/login`
- Email: `test@example.com`
- Password: `test123`

### 2. **O usar credenciales de demo**
- Email: `demo@aquawash.com`
- Password: `demo1234`

### 3. **Una vez autenticado**
- El token se guarda en `localStorage`
- Todos los endpoints funcionarán correctamente
- El formulario de registro de lavados cargará datos

## Verificación

### 1. **Probar Login**
```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. **Probar Endpoint con Token**
```bash
curl -X GET http://127.0.0.1:8000/empleados/ \
  -H "Authorization: Bearer TOKEN_AQUI"
```

## Conclusión

**El problema NO es CORS**. El backend está configurado correctamente. El frontend necesita:

1. **Autenticarse primero** en `/login`
2. **Guardar el token** en `localStorage`
3. **Incluir el token** en las peticiones a `/lavados/`

Una vez autenticado, todos los endpoints funcionarán correctamente sin errores de CORS.
