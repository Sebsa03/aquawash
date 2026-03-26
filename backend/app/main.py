from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import conectar, desconectar
from app.routers import autenticacion, lavados, empleados, adicionales, estadisticas

app = FastAPI(title="AquaWash API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await conectar()

@app.on_event("shutdown")
async def shutdown():
    await desconectar()

app.include_router(autenticacion.router, prefix="/auth",         tags=["Autenticacion"])
app.include_router(lavados.router,       prefix="/lavados",      tags=["Lavados"])
app.include_router(empleados.router,     prefix="/empleados",    tags=["Empleados"])
app.include_router(adicionales.router,   prefix="/adicionales",  tags=["Adicionales"])
app.include_router(estadisticas.router,  prefix="/estadisticas", tags=["Estadisticas"])

@app.get("/")
async def raiz():
    return {"mensaje": "AquaWash API funcionando"}