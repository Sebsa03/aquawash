from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.auth import get_lavadero_actual
from app.models.schemas import LavadoCrear, LavadoRespuesta
from typing import List, Optional
import json

router = APIRouter()

@router.post("/", response_model=LavadoRespuesta, status_code=201)
async def registrar_lavado(
    datos: LavadoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Registra un nuevo lavado.
    Calcula el precio base según el tipo de vehículo
    y lo guarda como valor histórico fijo.
    """
    # Obtener el precio base del tipo de vehículo
    precios = await db.fetchrow(
        f"SELECT precio_{datos.tipo_vehiculo} AS precio_base "
        f"FROM lavaderos WHERE id = $1",
        lavadero_id
    )
    precio_base       = precios["precio_base"]
    precio_adicionales = sum(a.precio for a in datos.adicionales_aplicados)
    precio_total      = precio_base + precio_adicionales

    # Serializar listas a JSON para guardar en JSONB
    adicionales_json   = json.dumps([a.dict() for a in datos.adicionales_aplicados])
    etiquetas_json     = json.dumps(datos.etiquetas_estado)

    fila = await db.fetchrow(
        """
        INSERT INTO lavados (
            lavadero_id, empleado_id, placa, tipo_vehiculo,
            hora_ingreso, precio_base, precio_adicionales, precio_total,
            adicionales_aplicados, etiquetas_estado, nota
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11)
        RETURNING *
        """,
        lavadero_id, datos.empleado_id, datos.placa.upper(),
        datos.tipo_vehiculo, datos.hora_ingreso,
        precio_base, precio_adicionales, precio_total,
        adicionales_json, etiquetas_json, datos.nota
    )
    return dict(fila)


@router.get("/", response_model=List[LavadoRespuesta])
async def listar_lavados(
    periodo: str        = Query("hoy", enum=["hoy","semana","mes","todo"]),
    tipo:    Optional[str] = Query(None),
    buscar:  Optional[str] = Query(None),
    pagina:  int           = Query(1, ge=1),
    limite:  int           = Query(50, ge=1, le=200),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Devuelve el historial con filtros opcionales.
    Paginado para no traer miles de registros de golpe.
    """
    # Construir filtro de fecha según período
    filtros = {"hoy": "fecha = CURRENT_DATE",
               "semana": "fecha >= date_trunc('week', CURRENT_DATE)",
               "mes": "fecha >= date_trunc('month', CURRENT_DATE)",
               "todo": "TRUE"}
    filtro_fecha = filtros[periodo]

    filtro_tipo   = f"AND tipo_vehiculo = '{tipo}'" if tipo else ""
    filtro_buscar = f"AND (placa ILIKE '%{buscar}%')" if buscar else ""
    offset        = (pagina - 1) * limite

    filas = await db.fetch(
        f"""
        SELECT * FROM lavados
        WHERE lavadero_id = $1
          AND {filtro_fecha}
          {filtro_tipo}
          {filtro_buscar}
        ORDER BY fecha DESC, hora_ingreso DESC
        LIMIT $2 OFFSET $3
        """,
        lavadero_id, limite, offset
    )
    return [dict(f) for f in filas]


@router.delete("/{lavado_id}", status_code=204)
async def eliminar_lavado(
    lavado_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Elimina un lavado. El lavadero_id en el WHERE evita borrar datos de otro lavadero."""
    resultado = await db.execute(
        "DELETE FROM lavados WHERE id = $1 AND lavadero_id = $2",
        lavado_id, lavadero_id
    )
    if resultado == "DELETE 0":
        raise HTTPException(status_code=404, detail="Lavado no encontrado")