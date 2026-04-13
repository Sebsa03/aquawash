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
    tipo_vehiculo:        str   # acepta tipos dinámicos de vehiculos_catalogo
    empleado_id:          int
    hora_ingreso:         time
    adicionales_aplicados: List[AdicionalAplicado] = []
    etiquetas_estado:     List[str] = []
    nota:                 Optional[str] = None
    subcategoria:         Optional[str] = None
    nivel_suciedad:       Optional[str] = None
    cliente_nombre:       Optional[str] = None
    cliente_telefono:     Optional[str] = None

class LavadoRespuesta(BaseModel):
    id:                   int
    placa:                str
    tipo_vehiculo:        str
    empleado_id:          Optional[int]
    empleado_nombre:      Optional[str] = None
    fecha:                date
    hora_ingreso:         time
    precio_base:          int
    precio_adicionales:   int
    precio_total:         int
    adicionales_aplicados: list
    etiquetas_estado:     list
    nota:                 Optional[str]
    subcategoria:         Optional[str]
    nivel_suciedad:       Optional[str]
    cliente_nombre:       Optional[str]
    cliente_telefono:     Optional[str]
    estado_actual:        str
    hora_lavando:         Optional[time]
    hora_terminado:       Optional[time]
    hora_entregado:       Optional[time]
    hora_cancelado:       Optional[time]
    motivo_cancelacion:   Optional[str]

class EstadoActualizar(BaseModel):
    estado: str  # 'espera', 'lavando', 'terminado', 'entregado', 'cancelado'
    motivo_cancelacion: Optional[str] = None

class LavadoActualizar(BaseModel):
    placa:                Optional[str] = None
    tipo_vehiculo:        Optional[str] = None
    empleado_id:          Optional[int] = None
    adicionales_aplicados: Optional[List[AdicionalAplicado]] = None
    nota:                 Optional[str] = None
    subcategoria:         Optional[str] = None
    nivel_suciedad:       Optional[str] = None
    cliente_nombre:       Optional[str] = None
    cliente_telefono:     Optional[str] = None

# ── ESTADÍSTICAS ─────────────────────────────────────────
class EstadisticasRespuesta(BaseModel):
    vehiculos:   int
    ingresos:    int
    adicionales: int
    promedio:    float


# ── VEHÍCULOS CATÁLOGO ────────────────────────────────────
class VehiculoCrear(BaseModel):
    nombre: str
    precio: int
    icono:  Optional[str] = "🚗"

class VehiculoActualizar(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[int] = None
    icono:  Optional[str] = None
    activo: Optional[bool] = None

class VehiculoRespuesta(BaseModel):
    id:     int
    nombre: str
    precio: int
    icono:  Optional[str]
    activo: bool