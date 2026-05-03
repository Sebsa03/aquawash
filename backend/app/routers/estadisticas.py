from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.routers.auth import get_lavadero_actual

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
    periodo: str = Query("semana", enum=["hoy","semana","mes","mes_pasado","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Estadísticas generales filtradas por período."""
    filtros = {
        "hoy":        "fecha = CURRENT_DATE",
        "semana":     "fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":        "fecha >= date_trunc('month', CURRENT_DATE)",
        "mes_pasado": "fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND fecha < date_trunc('month', CURRENT_DATE)",
        "total":      "TRUE"
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
    periodo: str = Query("hoy", enum=["hoy","semana","mes","mes_pasado","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Desglose de lavados e ingresos por tipo de vehículo."""
    filtros = {
        "hoy":        "fecha = CURRENT_DATE",
        "semana":     "fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":        "fecha >= date_trunc('month', CURRENT_DATE)",
        "mes_pasado": "fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND fecha < date_trunc('month', CURRENT_DATE)",
        "total":      "TRUE"
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
    periodo: str = Query("hoy", enum=["hoy","semana","mes","mes_pasado","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Ranking de empleados filtrado por período."""
    filtros = {
        "hoy":        "AND l.fecha = CURRENT_DATE",
        "semana":     "AND l.fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":        "AND l.fecha >= date_trunc('month', CURRENT_DATE)",
        "mes_pasado": "AND l.fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND l.fecha < date_trunc('month', CURRENT_DATE)",
        "total":      ""
    }
    filas = await db.fetch(
        f"""
        SELECT
            e.id                              AS empleado_id,
            e.nombre                          AS empleado_nombre,
            COUNT(l.id)                       AS total_lavados,
            COALESCE(SUM(l.precio_total), 0)  AS total_ingresos,
            COALESCE(AVG(EXTRACT(EPOCH FROM (l.hora_terminado - l.hora_ingreso))/60), 0) AS minutos_promedio
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


@router.get("/ranking-detalle")
async def ranking_empleados_detalle(
    periodo: str = Query("hoy", enum=["hoy","semana","mes","mes_pasado","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Desglose de rendimiento por empleado y por tipo de vehículo."""
    filtros = {
        "hoy":        "AND l.fecha = CURRENT_DATE",
        "semana":     "AND l.fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":        "AND l.fecha >= date_trunc('month', CURRENT_DATE)",
        "mes_pasado": "AND l.fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND l.fecha < date_trunc('month', CURRENT_DATE)",
        "total":      ""
    }
    filas = await db.fetch(
        f"""
        SELECT
            e.id                              AS empleado_id,
            e.nombre                          AS empleado_nombre,
            l.tipo_vehiculo                   AS tipo_vehiculo,
            COUNT(l.id)                       AS total_lavados,
            COALESCE(SUM(l.precio_total), 0)  AS total_ingresos,
            COALESCE(AVG(EXTRACT(EPOCH FROM (l.hora_terminado - l.hora_ingreso))/60), 0) AS minutos_promedio
        FROM empleados e
        JOIN lavados l ON l.empleado_id = e.id {filtros[periodo]}
        WHERE e.lavadero_id = $1 AND l.estado != 'cancelado'
        GROUP BY e.id, e.nombre, l.tipo_vehiculo
        ORDER BY e.nombre, total_lavados DESC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]

@router.get("/tendencia")
async def tendencia_ingresos(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Ingresos de los últimos 6 meses."""
    filas = await db.fetch(
        f"""
        SELECT
            TO_CHAR(date_trunc('month', fecha), 'YYYY-MM') AS mes,
            COALESCE(SUM(precio_total), 0) AS ingresos,
            COUNT(id) AS lavados
        FROM lavados
        WHERE lavadero_id = $1 AND estado != 'cancelado' 
          AND fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
        GROUP BY date_trunc('month', fecha)
        ORDER BY date_trunc('month', fecha) ASC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]

@router.get("/cancelados")
async def estadisticas_cancelados(
    periodo: str = Query("hoy", enum=["hoy","semana","mes","mes_pasado","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Lavados cancelados con sus motivos y operador."""
    filtros = {
        "hoy":        "fecha = CURRENT_DATE",
        "semana":     "fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":        "fecha >= date_trunc('month', CURRENT_DATE)",
        "mes_pasado": "fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND fecha < date_trunc('month', CURRENT_DATE)",
        "total":      "TRUE"
    }
    filas = await db.fetch(
        f"""
        SELECT
            l.id, l.placa, l.tipo_vehiculo, l.fecha, l.hora_cancelado, 
            e.nombre AS empleado_nombre, l.motivo_cancelacion
        FROM lavados l
        LEFT JOIN empleados e ON l.empleado_id = e.id
        WHERE l.lavadero_id = $1 AND l.estado = 'cancelado' AND l.{filtros[periodo].replace('fecha', 'fecha')}
        ORDER BY l.hora_cancelado DESC
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

@router.get("/tendencia-diaria")
async def tendencia_diaria(
    periodo: str = Query("mes", enum=["semana","mes","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Ingresos y lavados agrupados por día para ver la evolución del mes/semana."""
    filtros = {
        "semana": "fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":    "fecha >= date_trunc('month', CURRENT_DATE)",
        "total":  "fecha >= CURRENT_DATE - INTERVAL '30 days'"
    }
    filas = await db.fetch(
        f"""
        SELECT
            TO_CHAR(fecha, 'DD/MM') as dia,
            COALESCE(SUM(precio_total), 0) AS ingresos,
            COUNT(id) AS lavados
        FROM lavados
        WHERE lavadero_id = $1 AND estado != 'cancelado' AND {filtros[periodo]}
        GROUP BY fecha
        ORDER BY fecha ASC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]

@router.get("/horas-pico")
async def horas_pico(
    periodo: str = Query("mes", enum=["hoy","semana","mes","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Cantidad de lavados agrupados por hora de ingreso."""
    filtros = {
        "hoy":    "fecha = CURRENT_DATE",
        "semana": "fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":    "fecha >= date_trunc('month', CURRENT_DATE)",
        "total":  "TRUE"
    }
    filas = await db.fetch(
        f"""
        SELECT
            EXTRACT(HOUR FROM hora_ingreso) as hora,
            COUNT(id) as lavados
        FROM lavados
        WHERE lavadero_id = $1 AND estado != 'cancelado' AND {filtros[periodo]}
        GROUP BY EXTRACT(HOUR FROM hora_ingreso)
        ORDER BY hora ASC
        """,
        lavadero_id
    )
    # Llenar horas vacías para un gráfico continuo (6am a 8pm)
    resultados = {h: 0 for h in range(6, 21)}
    for f in filas:
        h = int(f["hora"])
        if h in resultados:
            resultados[h] = f["lavados"]
    return [{"hora": f"{h}:00", "lavados": v} for h, v in resultados.items()]

@router.get("/recurrentes")
async def clientes_recurrentes(
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Calcula cuántos clientes son recurrentes (placa vista > 1 vez) vs nuevos."""
    filas = await db.fetch(
        """
        SELECT 
            placa, COUNT(id) as visitas
        FROM lavados
        WHERE lavadero_id = $1 AND estado != 'cancelado'
        GROUP BY placa
        """,
        lavadero_id
    )
    total_unicos = len(filas)
    recurrentes = sum(1 for f in filas if f["visitas"] > 1)
    nuevos = total_unicos - recurrentes
    return {"total_clientes_unicos": total_unicos, "recurrentes": recurrentes, "nuevos": nuevos}

@router.get("/servicios")
async def servicios_mas_vendidos(
    periodo: str = Query("mes", enum=["hoy","semana","mes","total"]),
    db=Depends(get_db),
    lavadero_id: int = Depends(get_lavadero_actual)
):
    """Agrupación por nivel de suciedad."""
    filtros = {
        "hoy":    "fecha = CURRENT_DATE",
        "semana": "fecha >= CURRENT_DATE - INTERVAL '7 days'",
        "mes":    "fecha >= date_trunc('month', CURRENT_DATE)",
        "total":  "TRUE"
    }
    filas = await db.fetch(
        f"""
        SELECT 
            COALESCE(nivel_suciedad, 'Basico') as nivel,
            COUNT(id) as total,
            COALESCE(SUM(precio_total), 0) as ingresos
        FROM lavados
        WHERE lavadero_id = $1 AND estado != 'cancelado' AND {filtros[periodo]}
        GROUP BY COALESCE(nivel_suciedad, 'Basico')
        ORDER BY total DESC
        """,
        lavadero_id
    )
    return [dict(f) for f in filas]