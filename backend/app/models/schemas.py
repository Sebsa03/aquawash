from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, time
from enum import Enum


# ── ENUMS ────────────────────────────────────────────────
class TipoVehiculo(str, Enum):
    moto    = "moto"
    carro   = "carro"
    furgon  = "furgon"
    camion  = "camion"
    bus     = "bus"


# ── AUTH ─────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


# ── EMPLEADOS ────────────────────────────────────────────
class EmpleadoCrear(BaseModel):
    nombre: str

class EmpleadoRespuesta(BaseModel):
    id:     int
    nombre: str
    activo: bool


# ── ADICIONALES ──────────────────────────────────────────
class AdicionalCrear(BaseModel):
    nombre: str
    precio: int

class AdicionalActualizar(BaseModel):
    precio: int

class AdicionalRespuesta(BaseModel):
    id:     int
    nombre: str
    precio: int
    activo: bool


# ── LAVADOS ──────────────────────────────────────────────
class AdicionalAplicado(BaseModel):
    nombre: str
    precio: int

class LavadoCrear(BaseModel):
    placa:                str
    tipo_vehiculo:        TipoVehiculo
    empleado_id:          int
    hora_ingreso:         time
    adicionales_aplicados: List[AdicionalAplicado] = []
    etiquetas_estado:     List[str] = []
    nota:                 Optional[str] = None

class LavadoRespuesta(BaseModel):
    id:                   int
    placa:                str
    tipo_vehiculo:        str
    empleado_id:          Optional[int]
    fecha:                date
    hora_ingreso:         time
    precio_base:          int
    precio_adicionales:   int
    precio_total:         int
    adicionales_aplicados: list
    etiquetas_estado:     list
    nota:                 Optional[str]


# ── ESTADÍSTICAS ─────────────────────────────────────────
class EstadisticasRespuesta(BaseModel):
    vehiculos:   int
    ingresos:    int
    adicionales: int
    promedio:    float