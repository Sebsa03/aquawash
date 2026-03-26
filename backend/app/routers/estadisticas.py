from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.auth import get_lavadero_actual

router = APIRouter()

@router.get("/hoy")
async def estadisticas_hoy(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Dashboard del día — usa la vista v_estadisticas_hoy."""
    fila = await db.fetchrow(
        "SELECT * FROM v_estadisticas_hoy WHERE lavadero_id = $1",
        lavadero_id
    )
    if not fila:
        return {"vehiculos_hoy": 0, "ingresos_hoy": 0,
                "adicionales_hoy": 0, "promedio_hoy": 0}
    return dict(fila)


@router.get("/resumen")
async def resumen_por_periodo(
    periodo: str = Query("semana", enum=["hoy","semana","mes","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Estadísticas generales filtradas por período."""
    filtros = {
        "hoy":    "fecha = CURRENT_DATE",
        "semana": "fecha >= date_trunc('week', CURRENT_DATE)",
        "mes":    "fecha >= date_trunc('month', CURRENT_DATE)",
        "total":  "TRUE"
    }
    fila = await db.fetchrow(
        f"""
        SELECT
            COUNT(*)                             AS vehiculos,
            COALESCE(SUM(precio_total), 0)       AS ingresos,
            COALESCE(SUM(precio_adicionales), 0) AS adicionales,
            COALESCE(AVG(precio_total), 0)       AS promedio
        FROM lavados
        WHERE lavadero_id = $1 AND {filtros[periodo]}
        """,
        lavadero_id
    )
    return dict(fila)


@router.get("/por-tipo")
async def estadisticas_por_tipo(
    periodo: str = Query("hoy", enum=["hoy","semana","mes","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Desglose de lavados e ingresos por tipo de vehículo."""
    filtros = {
        "hoy":    "fecha = CURRENT_DATE",
        "semana": "fecha >= date_trunc('week', CURRENT_DATE)",
        "mes":    "fecha >= date_trunc('month', CURRENT_DATE)",
        "total":  "TRUE"
    }
    filas = await db.fetch(
        f"""
        SELECT
            tipo_vehiculo,
            COUNT(*)                       AS total,
            COALESCE(SUM(precio_total), 0) AS ingresos
        FROM lavados
        WHERE lavadero_id = $1 AND {filtros[periodo]}
        GROUP BY tipo_vehiculo
        ORDER BY total DESC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]


@router.get("/ranking")
async def ranking_empleados(
    periodo: str = Query("hoy", enum=["hoy","semana","mes","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Ranking de empleados filtrado por período."""
    filtros = {
        "hoy":    "AND l.fecha = CURRENT_DATE",
        "semana": "AND l.fecha >= date_trunc('week', CURRENT_DATE)",
        "mes":    "AND l.fecha >= date_trunc('month', CURRENT_DATE)",
        "total":  ""
    }
    filas = await db.fetch(
        f"""
        SELECT
            e.id                              AS empleado_id,
            e.nombre                          AS empleado_nombre,
            COUNT(l.id)                       AS total_lavados,
            COALESCE(SUM(l.precio_total), 0)  AS total_ingresos
        FROM empleados e
        LEFT JOIN lavados l
            ON l.empleado_id = e.id {filtros[periodo]}
        WHERE e.lavadero_id = $1 AND e.activo = TRUE
        GROUP BY e.id, e.nombre
        ORDER BY total_lavados DESC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]


@router.get("/placas")
async def resumen_placas(
    buscar: str = Query(None),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Historial acumulado por placa — usa la vista v_resumen_placas."""
    filtro = f"AND placa ILIKE '%{buscar}%'" if buscar else ""
    filas = await db.fetch(
        f"""
        SELECT * FROM v_resumen_placas
        WHERE lavadero_id = $1 {filtro}
        ORDER BY total_lavados DESC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]