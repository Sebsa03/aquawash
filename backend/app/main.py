from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import conectar, desconectar
from app.routers import autenticacion, lavados, empleados, adicionales, estadisticas, config, caja, inventario
from app.logger import logger
from app.config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error global inesperado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ha ocurrido un error interno en el servidor."},
    )

@app.on_event("startup")
async def startup():
    logger.info("Iniciando aplicación y conectando a la BD...")
    await conectar()
    logger.info("Conexión a la BD establecida.")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Cerrando aplicación y desconectando BD...")
    await desconectar()

app.include_router(autenticacion.router, prefix="/auth",         tags=["Autenticacion"])
app.include_router(lavados.router,       prefix="/lavados",      tags=["Lavados"])
app.include_router(empleados.router,     prefix="/empleados",    tags=["Empleados"])
app.include_router(adicionales.router,   prefix="/adicionales",  tags=["Adicionales"])
app.include_router(estadisticas.router,  prefix="/estadisticas", tags=["Estadisticas"])
app.include_router(config.router,        prefix="/config",       tags=["Configuracion"])
app.include_router(caja.router,          prefix="/caja",         tags=["Caja Financiera"])
app.include_router(inventario.router,    prefix="/inventario",   tags=["Inventario"])

@app.get("/")
async def raiz():
    return {"mensaje": f"{settings.app_name} ({settings.environment}) funcionando"}