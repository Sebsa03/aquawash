from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.routers.auth import get_lavadero_actual
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

router = APIRouter()

# ── SCHEMAS ──────────────────────────────────────────────
class EgresoCrear(BaseModel):
    concepto: str
    monto: int

class EgresoRespuesta(BaseModel):
    id: int
    lavadero_id: int
    concepto: str
    monto: int
    fecha: datetime

class ResumenCajaRespuesta(BaseModel):
    ingresos_efectivo: int
    ingresos_tarjeta: int
    ingresos_transferencia: int
    ingresos_total: int
    egresos_total: int
    utilidad_neta: int

class CierreCajaCrear(BaseModel):
    fecha_cierre: date
    observaciones: Optional[str] = None

class CierreCajaRespuesta(BaseModel):
    id: int
    lavadero_id: int
    fecha_cierre: date
    ingresos_efectivo: int
    ingresos_tarjeta: int
    ingresos_transferencia: int
    egresos_total: int
    utilidad_neta: int
    observaciones: Optional[str]
    creado_en: datetime

# ── ENDPOINTS ────────────────────────────────────────────

@router.get("/resumen", response_model=ResumenCajaRespuesta)
async def obtener_resumen_caja(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """
    Obtiene el resumen de ingresos (por método de pago) y egresos en un rango de fechas.
    Solo cuenta los lavados con estado 'terminado' o 'entregado'.
    Si no se pasan fechas, asume el día de hoy.
    """
    if not fecha_inicio:
        fecha_inicio = date.today()
    if not fecha_fin:
        fecha_fin = date.today()

    # Ingresos
    ingresos_row = await db.fetchrow(
        """
        SELECT 
            COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN precio_total ELSE 0 END), 0) as ingresos_efectivo,
            COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN precio_total ELSE 0 END), 0) as ingresos_tarjeta,
            COALESCE(SUM(CASE WHEN metodo_pago IN ('transferencia', 'nequi', 'daviplata') THEN precio_total ELSE 0 END), 0) as ingresos_transferencia,
            COALESCE(SUM(precio_total), 0) as ingresos_total
        FROM lavados
        WHERE lavadero_id = $1
          AND fecha >= $2 AND fecha <= $3
          AND estado_actual IN ('terminado', 'entregado')
        """,
        lavadero_id, fecha_inicio, fecha_fin
    )

    # Egresos
    egresos_row = await db.fetchrow(
        """
        SELECT COALESCE(SUM(monto), 0) as egresos_total
        FROM egresos
        WHERE lavadero_id = $1
          AND DATE(fecha AT TIME ZONE 'America/Bogota') >= $2 
          AND DATE(fecha AT TIME ZONE 'America/Bogota') <= $3
        """,
        lavadero_id, fecha_inicio, fecha_fin
    )

    ing_efectivo = ingresos_row["ingresos_efectivo"]
    ing_tarjeta = ingresos_row["ingresos_tarjeta"]
    ing_transf = ingresos_row["ingresos_transferencia"]
    ing_total = ingresos_row["ingresos_total"]
    eg_total = egresos_row["egresos_total"]

    return {
        "ingresos_efectivo": ing_efectivo,
        "ingresos_tarjeta": ing_tarjeta,
        "ingresos_transferencia": ing_transf,
        "ingresos_total": ing_total,
        "egresos_total": eg_total,
        "utilidad_neta": ing_total - eg_total
    }

@router.get("/egresos", response_model=List[EgresoRespuesta])
async def listar_egresos(
    fecha: Optional[date] = Query(None),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    if not fecha:
        fecha = date.today()
        
    filas = await db.fetch(
        """
        SELECT * FROM egresos
        WHERE lavadero_id = $1 AND DATE(fecha AT TIME ZONE 'America/Bogota') = $2
        ORDER BY fecha DESC
        """,
        lavadero_id, fecha
    )
    return [dict(f) for f in filas]

@router.post("/egresos", response_model=EgresoRespuesta, status_code=201)
async def registrar_egreso(
    datos: EgresoCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    if datos.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")
        
    fila = await db.fetchrow(
        """
        INSERT INTO egresos (lavadero_id, concepto, monto)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        lavadero_id, datos.concepto.strip(), datos.monto
    )
    return dict(fila)

@router.delete("/egresos/{egreso_id}", status_code=204)
async def eliminar_egreso(
    egreso_id: int,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    resultado = await db.execute(
        "DELETE FROM egresos WHERE id = $1 AND lavadero_id = $2",
        egreso_id, lavadero_id
    )
    if resultado == "DELETE 0":
        raise HTTPException(status_code=404, detail="Egreso no encontrado")

# ── CIERRE DE CAJA ───────────────────────────────────────

@router.get("/cierre/{fecha}", response_model=Optional[CierreCajaRespuesta])
async def obtener_cierre(
    fecha: date,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    fila = await db.fetchrow(
        "SELECT * FROM cierres_caja WHERE lavadero_id = $1 AND fecha_cierre = $2",
        lavadero_id, fecha
    )
    if not fila:
        return None
    return dict(fila)

@router.get("/cierres", response_model=List[CierreCajaRespuesta])
async def listar_cierres(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    filas = await db.fetch(
        "SELECT * FROM cierres_caja WHERE lavadero_id = $1 ORDER BY fecha_cierre DESC LIMIT 30",
        lavadero_id
    )
    return [dict(f) for f in filas]

@router.post("/cierre", response_model=CierreCajaRespuesta, status_code=201)
async def registrar_cierre(
    datos: CierreCajaCrear,
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    # Verificar si ya existe
    existe = await db.fetchval(
        "SELECT id FROM cierres_caja WHERE lavadero_id = $1 AND fecha_cierre = $2",
        lavadero_id, datos.fecha_cierre
    )
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un cierre de caja para esta fecha")

    # Calcular valores exactos
    # Ingresos
    ingresos_row = await db.fetchrow(
        """
        SELECT 
            COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN precio_total ELSE 0 END), 0) as ing_efec,
            COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN precio_total ELSE 0 END), 0) as ing_tarj,
            COALESCE(SUM(CASE WHEN metodo_pago IN ('transferencia', 'nequi', 'daviplata') THEN precio_total ELSE 0 END), 0) as ing_trans,
            COALESCE(SUM(precio_total), 0) as ing_total
        FROM lavados
        WHERE lavadero_id = $1 AND fecha = $2 AND estado_actual IN ('terminado', 'entregado')
        """, lavadero_id, datos.fecha_cierre
    )

    # Egresos
    egresos_total = await db.fetchval(
        "SELECT COALESCE(SUM(monto), 0) FROM egresos WHERE lavadero_id = $1 AND DATE(fecha AT TIME ZONE 'America/Bogota') = $2",
        lavadero_id, datos.fecha_cierre
    )

    ing_efec = ingresos_row["ing_efec"]
    ing_tarj = ingresos_row["ing_tarj"]
    ing_trans = ingresos_row["ing_trans"]
    utilidad = ingresos_row["ing_total"] - egresos_total

    fila = await db.fetchrow(
        """
        INSERT INTO cierres_caja (
            lavadero_id, fecha_cierre, ingresos_efectivo, ingresos_tarjeta, 
            ingresos_transferencia, egresos_total, utilidad_neta, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        """,
        lavadero_id, datos.fecha_cierre, ing_efec, ing_tarj, ing_trans, egresos_total, utilidad, datos.observaciones
    )
    return dict(fila)
