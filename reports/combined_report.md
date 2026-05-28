# Informe de duplicación y recomendaciones — Backend + Frontend

Fecha: 2026-05-28

**Resumen ejecutivo**
- Se localizaron patrones duplicados y bloques repetidos tanto en `backend/` como en `frontend/`.
- Generé reportes heurísticos JSON en `backend/duplicate_report.json` y `frontend/duplicate_report.json` con ubicaciones por patrón.
- Este informe consolida los hallazgos, muestra archivos clave y propone refactors priorizados y pasos de verificación.

**Archivos con reportes brutos**
- Backend: [backend/duplicate_report.json](backend/duplicate_report.json)
- Frontend: [frontend/duplicate_report.json](frontend/duplicate_report.json)

**Hallazgos — Backend**
- Duplicación principal:
  - Repetidos `INSERT INTO lavaderos` en varios puntos de inicialización/registro (`backend/app/routers/autenticacion.py`, `backend/app/autenticacion.py`) y scripts en `backend/archive`.
    - Ejemplo: [backend/app/routers/autenticacion.py](backend/app/routers/autenticacion.py#L100-L140)
  - Repetición de inserción de adicionales: `INSERT INTO adicionales_catalogo` en registro/demo y scripts (múltiples apariciones).
    - Ejemplo: [backend/app/routers/adicionales.py](backend/app/routers/adicionales.py#L1-L60)
  - Lógica de filtros por período (`filtros = {...}`) repetida en muchos endpoints de `backend/app/routers/estadisticas.py` y en `lavados.py`.
  - Parsing de campos JSON (uso de `json.loads`) repetido en `lavados.py` y `config.py`.
  - Función `parse_lavado` central que aborda JSONB, pero hay otros lugares que repiten parsing manual.
- Riesgos y coste de mantenimiento:
  - Cambios en la estructura de `lavaderos` o en la lista de `adicionales` deben actualizarse en múltiples lugares.
  - Posibilidad de inconsistencias (p.ej. diferencias en valores por defecto entre scripts de demo y la creación en producción).

**Recomendaciones — Backend (priorizadas)**
1. Crear `backend/app/utils/bootstrap.py` y mover:
   - `create_lavadero_common(db, payload)` que haga el `INSERT INTO lavaderos` centralizado.
   - `create_default_adicionales(db, lavadero_id)` que inserte la lista de adicionales.
2. Extraer helper `backend/app/utils/sql_filters.py` con `build_period_filter(periodo, alias='l')` y usarlo desde `estadisticas.py` y `lavados.py`.
3. Extraer `backend/app/utils/json_utils.py` con `safe_loads(val, default=[])` y `parse_jsonb_row(row, campos)` para evitar múltiples `try/except json.loads`.
4. Mantener los scripts en `backend/archive/` (ya archivados) pero modificar su uso para importar y reutilizar las utilidades nuevas si se reejecutan.

**Hallazgos — Frontend**
- Duplicación principal:
  - Lectura/escritura de token `aw_token` en `localStorage` desde varios componentes (`AuthContext.jsx`, `AppLayout.jsx`, páginas) aunque la mayor parte del flujo está centralizado en `AuthContext`.
  - Única implementación de wrapper de red `request` en `frontend/src/services/api.js` (esto es bueno) pero varios componentes referencian `localStorage.getItem('aw_token')` directamente en lugar de usar `AuthContext`.
  - Uso de `GoogleLogin` condicionado por `VITE_GOOGLE_CLIENT_ID` repetido en `Login.jsx` y `Register.jsx`; mensajes de 'Google no configurado' duplicados.
  - Código generado (bundle en `frontend/dist`) contiene versiones compiladas de estas funciones (esperado) — consideración para evitar duplicación manual en origen.

**Recomendaciones — Frontend (priorizadas)**
1. Crear componente reutilizable `frontend/src/components/GoogleAuth.jsx` que encapsule `GoogleLogin` y el mensaje de configuración, y usarlo en `Login.jsx` y `Register.jsx`.
2. Evitar lecturas directas a `localStorage` fuera de `AuthContext`:
   - Refactorizar componentes (p.ej. `AppLayout.jsx`, `pages/app/Nuevo.jsx`) para consumir el token desde `AuthContext` mediante el hook `useAuth()` (si existe) o importar funciones de `AuthContext`.
3. Extraer strings repetidos y constantes a `frontend/src/constants.js` (p.ej. key `aw_token`, mensajes de Google no configurado).
4. Mantener `frontend/src/services/api.js` como único wrapper de red; documentar su uso y asegurar que no haya funciones `fetch` directas dispersas.

**Verificación y pruebas sugeridas**
- Backend:
  - Crear pruebas unitarias mínimas (o un script de smoke) que invoque `create_lavadero_common` y `create_default_adicionales` y verifique que las tablas se llenan correctamente.
  - Correr `pytest` en `backend/tests` (si existen) o un script manual de verificación.
- Frontend:
  - Reiniciar Vite y probar que `Login` y `Register` usan `GoogleAuth` (si se implementa).
  - Probar el flujo demo `/demo` y control de errores cuando el backend está caído.

**Herramientas útiles (opcional)**
- Ejecutar un detector de duplicados automático: `jscpd` (soporta Python/JS) en la raíz del proyecto:

```bash
# instalar (npm)
npm install -g jscpd
# ejecutar
jscpd --path backend --reporters json --output backend/jscpd-report
jscpd --path frontend --reporters json --output frontend/jscpd-report
```

**Siguientes pasos propuestos**
- Opción A (rápida): Implemento los helpers en `backend/app/utils/` y un componente `GoogleAuth.jsx` en frontend, y actualizo 3-4 lugares clave (commit pequeño).
- Opción B (segura): Preparo un PR con los cambios propuestos (helpers + llamadas reemplazadas) para que lo revises.
- Opción C (solo informe): Generar un CSV/JSON exhaustivo con cada línea involucrada (más verboso).

Si quieres que aplique cambios, dime `A` o `B`; si prefieres sólo el informe detallado, dime `C`.
