from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth import get_lavadero_actual
from app.models.schemas import EmpleadoCrear, EmpleadoRespuesta
from typing import List

router = APIRouter()

@router.get("/", response_model=List[EmpleadoRespuesta])
async def listar_empleados(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Devuelve solo los empleados activos del lavadero."""
    filas = await db.fetch(
        "SELECT id, nombre, activo FROM empleados "
        "WHERE lavadero_id = $1 AND activo = TRUE "
        "ORDER BY nombre ASC",
        lavadero_id
    )
    return [dict(f) for f in filas]


@router.post("/", response_model=EmpleadoRespuesta, status_code=201)
async def agregar_empleado(
    datos: EmpleadoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Agrega un nuevo empleado.
    La BD rechaza duplicados por el UNIQUE constraint.
    """
    try:
        fila = await db.fetchrow(
            "INSERT INTO empleados (lavadero_id, nombre) "
            "VALUES ($1, $2) "
            "RETURNING id, nombre, activo",
            lavadero_id, datos.nombre.strip()
        )
        return dict(fila)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un empleado con el nombre '{datos.nombre}'"
        )


@router.delete("/{empleado_id}", status_code=204)
async def desactivar_empleado(
    empleado_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Borrado lógico: marca el empleado como inactivo.
    No borra el registro para preservar el historial.
    """
    resultado = await db.execute(
        "UPDATE empleados SET activo = FALSE "
        "WHERE id = $1 AND lavadero_id = $2",
        empleado_id, lavadero_id
    )
    if resultado == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Empleado no encontrado")