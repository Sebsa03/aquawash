from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth import get_lavadero_actual
from app.models.schemas import AdicionalCrear, AdicionalActualizar, AdicionalRespuesta
from typing import List

router = APIRouter()

@router.get("/", response_model=List[AdicionalRespuesta])
async def listar_adicionales(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Devuelve el catálogo activo de adicionales del lavadero."""
    filas = await db.fetch(
        "SELECT id, nombre, precio, activo "
        "FROM adicionales_catalogo "
        "WHERE lavadero_id = $1 AND activo = TRUE "
        "ORDER BY nombre ASC",
        lavadero_id
    )
    return [dict(f) for f in filas]


@router.post("/", response_model=AdicionalRespuesta, status_code=201)
async def crear_adicional(
    datos: AdicionalCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Agrega un nuevo servicio adicional al catálogo."""
    try:
        fila = await db.fetchrow(
            "INSERT INTO adicionales_catalogo (lavadero_id, nombre, precio) "
            "VALUES ($1, $2, $3) "
            "RETURNING id, nombre, precio, activo",
            lavadero_id, datos.nombre.strip(), datos.precio
        )
        return dict(fila)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un adicional con el nombre '{datos.nombre}'"
        )


@router.patch("/{adicional_id}", response_model=AdicionalRespuesta)
async def actualizar_precio(
    adicional_id: int,
    datos: AdicionalActualizar,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Actualiza el precio de un adicional."""
    fila = await db.fetchrow(
        "UPDATE adicionales_catalogo SET precio = $1 "
        "WHERE id = $2 AND lavadero_id = $3 "
        "RETURNING id, nombre, precio, activo",
        datos.precio, adicional_id, lavadero_id
    )
    if not fila:
        raise HTTPException(status_code=404, detail="Adicional no encontrado")
    return dict(fila)


@router.delete("/{adicional_id}", status_code=204)
async def eliminar_adicional(
    adicional_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Borrado lógico del adicional."""
    resultado = await db.execute(
        "UPDATE adicionales_catalogo SET activo = FALSE "
        "WHERE id = $1 AND lavadero_id = $2",
        adicional_id, lavadero_id
    )
    if resultado == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Adicional no encontrado")