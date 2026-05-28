def build_period_filter(periodo: str, alias: str = 'l') -> str:
    """Devuelve una expresión SQL para filtrar por período usando el alias de tabla proporcionado.

    Ejemplos retornados:
      build_period_filter('hoy', 'l') -> "l.fecha = CURRENT_DATE"
      build_period_filter('semana', 'l') -> "l.fecha >= CURRENT_DATE - INTERVAL '7 days'"
    """
    prefix = f"{alias}." if alias else ""
    filtros = {
      "hoy": f"{prefix}fecha = CURRENT_DATE",
      "semana": f"{prefix}fecha >= CURRENT_DATE - INTERVAL '7 days'",
      "mes": f"{prefix}fecha >= date_trunc('month', CURRENT_DATE)",
      "mes_pasado": f"{prefix}fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND {prefix}fecha < date_trunc('month', CURRENT_DATE)",
      "total": "TRUE"
    }
    return filtros.get(periodo, "TRUE")
