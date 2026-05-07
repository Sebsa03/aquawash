from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.routers.auth import get_lavadero_actual
from app.models.schemas import VehiculoCrear, VehiculoActualizar, VehiculoRespuesta
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

class PreciosUpdate(BaseModel):
    precio_moto:   Optional[int] = None
    precio_carro:  Optional[int] = None
    precio_furgon: Optional[int] = None
    precio_camion: Optional[int] = None
    precio_bus:    Optional[int] = None

class NombreUpdate(BaseModel):
    nombre:       Optional[str] = None
    ciudad:       Optional[str] = None
    telefono:     Optional[str] = None
    meta_mensual: Optional[int] = None
    activar_lealtad: Optional[bool] = None
    meta_lealtad: Optional[int] = None

@router.get("/")
async def get_config(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Devuelve la configuración completa del lavadero."""
    fila = await db.fetchrow(
        """
        SELECT nombre, ciudad, telefono, plan, estado_suscripcion,
               precio_moto, precio_carro, precio_furgon, precio_camion, precio_bus,
               meta_mensual, activar_lealtad, meta_lealtad
        FROM lavaderos WHERE id = $1
        """,
        lavadero_id
    )
    if not fila:
        raise HTTPException(status_code=404, detail="Lavadero no encontrado")
    return dict(fila)

@router.get("/vehiculos", response_model=List[VehiculoRespuesta])
async def get_vehiculos(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Obtiene los tipos de vehículos activos del lavadero."""
    filas = await db.fetch(
        "SELECT id, nombre, precio, icono, activo, subcategorias FROM vehiculos_catalogo "
        "WHERE lavadero_id = $1 ORDER BY id",
        lavadero_id
    )
    resultado = []
    for f in filas:
        d = dict(f)
        val = d.get("subcategorias")
        if isinstance(val, str):
            try:
                d["subcategorias"] = json.loads(val)
            except Exception:
                d["subcategorias"] = []
        elif val is None:
            d["subcategorias"] = []
        resultado.append(d)
    return resultado

@router.post("/vehiculos", response_model=VehiculoRespuesta)
async def crear_vehiculo(
    datos: VehiculoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Añade un nuevo tipo de vehículo."""
    try:
        subs_json = json.dumps(datos.subcategorias) if datos.subcategorias else "[]"
        fila = await db.fetchrow(
            """
            INSERT INTO vehiculos_catalogo (lavadero_id, nombre, precio, icono, subcategorias)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            RETURNING id, nombre, precio, icono, activo, subcategorias
            """,
            lavadero_id, datos.nombre.strip(), datos.precio, datos.icono, subs_json
        )
        d = dict(fila)
        val = d.get("subcategorias")
        d["subcategorias"] = json.loads(val) if isinstance(val, str) else (val or [])
        return d
    except Exception as e:
        raise HTTPException(status_code=400, detail="El tipo de vehículo ya existe o datos inválidos")

@router.patch("/vehiculos/{vehiculo_id}", response_model=VehiculoRespuesta)
async def actualizar_vehiculo(
    vehiculo_id: int,
    datos: VehiculoActualizar,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Actualiza el precio, icono o subcategorías de un vehículo."""
    sets, valores = [], []
    i = 1
    
    dict_datos = datos.dict(exclude_none=True)
    if "subcategorias" in dict_datos:
        dict_datos["subcategorias"] = json.dumps(dict_datos["subcategorias"])

    for campo, valor in dict_datos.items():
        if campo == "subcategorias":
            sets.append(f"{campo} = ${i}::jsonb")
        else:
            sets.append(f"{campo} = ${i}")
        valores.append(valor)
        i += 1
        
    if not sets:
        raise HTTPException(status_code=400, detail="Sin datos para actualizar")
    valores.extend([lavadero_id, vehiculo_id])
    
    fila = await db.fetchrow(
        f"""
        UPDATE vehiculos_catalogo SET {', '.join(sets)}
        WHERE lavadero_id = ${i} AND id = ${i+1}
        RETURNING id, nombre, precio, icono, activo, subcategorias
        """,
        *valores
    )
    if not fila:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    d = dict(fila)
    val = d.get("subcategorias")
    d["subcategorias"] = json.loads(val) if isinstance(val, str) else (val or [])
    return d

@router.delete("/vehiculos/{vehiculo_id}", status_code=204)
async def eliminar_vehiculo(
    vehiculo_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Elimina físicamente un tipo de vehículo del sistema."""
    resultado = await db.execute(
        "DELETE FROM vehiculos_catalogo WHERE id = $1 AND lavadero_id = $2",
        vehiculo_id, lavadero_id
    )
    if resultado == "DELETE 0":
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

@router.patch("/perfil")
async def actualizar_perfil(
    datos: NombreUpdate,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Actualiza nombre, ciudad y teléfono del lavadero."""
    sets = []
    valores = []
    i = 1
    for campo, valor in datos.dict(exclude_none=True).items():
        sets.append(f"{campo} = ${i}")
        valores.append(valor)
        i += 1
    if not sets:
        raise HTTPException(status_code=400, detail="Sin datos para actualizar")
    valores.append(lavadero_id)
    fila = await db.fetchrow(
        f"UPDATE lavaderos SET {', '.join(sets)} WHERE id = ${i} RETURNING nombre",
        *valores
    )
    return {"ok": True, "nombre": fila["nombre"]}
