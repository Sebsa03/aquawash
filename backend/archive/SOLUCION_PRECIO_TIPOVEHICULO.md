# Solución al Error: precio_tipovehiculo

## Problema Identificado

```
asyncpg.exceptions.UndefinedTableError: falta una entrada para la tabla «precio_tipovehiculo» en la cláusula FROM
```

## Causa del Error

Hay una consulta SQL que intenta acceder a una tabla `precio_tipovehiculo` que **NO EXISTE**.

## Estado Actual de la Base de Datos

### Tabla Correcta: `lavaderos`
```sql
SELECT id, nombre, 
       precio_moto, precio_carro, precio_furgon, 
       precio_camion, precio_bus
FROM lavaderos;
```

### Tabla Incorrecta: `precio_tipovehiculo`
```sql
-- ESTA TABLA NO EXISTE
SELECT * FROM precio_tipovehiculo;
-- ERROR: UndefinedTableError
```

## Solución

### 1. **Usar la consulta correcta del backend**

El backend ya usa la consulta correcta en `app/routers/lavados.py` (líneas 22-26):

```python
precios = await db.fetchrow(
    f"SELECT precio_{datos.tipo_vehiculo} AS precio_base "
    f"FROM lavaderos WHERE id = $1",
    lavadero_id
)
```

### 2. **Verificar que no haya código antiguo**

Buscar y eliminar cualquier referencia a `precio_tipovehiculo`:

```bash
# En backend:
grep -r "precio_tipovehiculo" --include="*.py" .

# En frontend:
grep -r "precio_tipovehiculo" --include="*.js" .
grep -r "precio_tipovehiculo" --include="*.jsx" .
```

### 3. **Si el error persiste, crear la tabla temporal**

Si hay código que no se puede modificar, crear la tabla:

```sql
CREATE TABLE precio_tipovehiculo (
    tipo_vehiculo VARCHAR PRIMARY KEY,
    precio_base INTEGER NOT NULL DEFAULT 0
);

INSERT INTO precio_tipovehiculo (tipo_vehiculo, precio_base) VALUES
    ('moto', 10000),
    ('carro', 15000),
    ('furgon', 20000),
    ('camion', 25000),
    ('bus', 30000);
```

## Verificación

### 1. **Probar consulta correcta**
```python
# Funciona
SELECT precio_carro AS precio_base FROM lavaderos WHERE id = 3;
```

### 2. **Probar consulta incorrecta**
```python
# Falla
SELECT * FROM precio_tipovehiculo WHERE tipo_vehiculo = 'carro';
```

## Recomendación

**NO crear la tabla `precio_tipovehiculo`**. En su lugar:

1. **Identificar** dónde está la consulta incorrecta
2. **Reemplazarla** con la consulta correcta
3. **Usar siempre** `precio_{tipo_vehiculo}` en la tabla `lavaderos`

## Estructura Correcta de Precios

```python
# CORRECTO
precio_base = await db.fetchval(
    f"SELECT precio_{tipo_vehiculo} FROM lavaderos WHERE id = $1",
    lavadero_id
)

# INCORRECTO
precio_base = await db.fetchval(
    "SELECT precio_base FROM precio_tipovehiculo WHERE tipo_vehiculo = $1",
    tipo_vehiculo
)
```

## Acción Inmediata

1. **Buscar** el código que usa `precio_tipovehiculo`
2. **Reemplazar** con la consulta correcta
3. **Probar** el endpoint de lavados

El backend está configurado correctamente, solo necesita eliminarse la referencia a la tabla inexistente.
