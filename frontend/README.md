# AquaWash - Sistema de Gestión de Lavaderos

Aplicación web para la gestión de lavaderos de vehículos con registro de lavados, gestión de empleados y estadísticas.

## Características

- 🚗 Registro de lavados con subcategorías y tipos de lavado
- 👥 Gestión de empleados
- 📊 Estadísticas en tiempo real
- 🏍 Soporte para múltiples tipos de vehículos
- 💰 Cálculo dinámico de precios

## Tecnologías

- Frontend: React + Vite
- Backend: FastAPI + PostgreSQL
- Autenticación: JWT

## Instalación

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Ejecución

### Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```
