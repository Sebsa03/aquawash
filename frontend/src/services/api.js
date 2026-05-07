const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const getToken = () => localStorage.getItem('aw_token')

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (res.status === 401) {
    localStorage.removeItem('aw_token')
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error del servidor' }))
    throw new Error(err.detail || 'Error desconocido')
  }

  if (res.status === 204) return null
  return res.json()
}

// AUTH
export const login = (email, password) =>
  request('POST', '/auth/login', { email, password })
export const verifyPinReq = (pin) => request('POST', '/auth/verify-pin', { pin })

// LAVADOS
export const getLavados = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return request('GET', `/lavados/?${q}`)
}
export const crearLavado   = (data) => request('POST', '/lavados/', data)
export const eliminarLavado = (id)  => request('DELETE', `/lavados/${id}`)
export const actualizarEstadoLavado = (id, estado, motivo = null) => request('PATCH', `/lavados/${id}/estado`, { estado, motivo_cancelacion: motivo })
export const actualizarLavado = (id, data) => request('PATCH', `/lavados/${id}`, data)
export const getBuscarPlaca = (placa) => request('GET', `/lavados/placa/${encodeURIComponent(placa)}`)
export const getSugerenciasPlaca = (q) => request('GET', `/lavados/sugerencias-placa?q=${encodeURIComponent(q)}`)
export const getVisitasCliente = (placa) => request('GET', `/lavados/cliente/${encodeURIComponent(placa)}/visitas`)

// EMPLEADOS
export const getEmpleados    = ()       => request('GET', '/empleados/')
export const crearEmpleado   = (nombre) => request('POST', '/empleados/', { nombre })
export const eliminarEmpleado = (id)    => request('DELETE', `/empleados/${id}`)

// ADICIONALES
export const getAdicionales      = ()          => request('GET', '/adicionales/')
export const crearAdicional      = (nombre, precio) => request('POST', '/adicionales/', { nombre, precio })
export const actualizarAdicional = (id, precio)     => request('PATCH', `/adicionales/${id}`, { precio })
export const eliminarAdicional   = (id)             => request('DELETE', `/adicionales/${id}`)

// ESTADÍSTICAS
export const getEstadisticasHoy = ()        => request('GET', '/estadisticas/hoy')
export const getResumen         = (periodo) => request('GET', `/estadisticas/resumen?periodo=${periodo}`)
export const getPorTipo         = (periodo) => request('GET', `/estadisticas/por-tipo?periodo=${periodo}`)
export const getTendencia       = ()        => request('GET', '/estadisticas/tendencia')
export const getTendenciaDiaria = (periodo) => request('GET', `/estadisticas/tendencia-diaria?periodo=${periodo}`)
export const getHorasPico       = (periodo) => request('GET', `/estadisticas/horas-pico?periodo=${periodo}`)
export const getRecurrentes     = ()        => request('GET', '/estadisticas/recurrentes')
export const getServicios       = (periodo) => request('GET', `/estadisticas/servicios?periodo=${periodo}`)
export const getRanking         = (periodo) => request('GET', `/estadisticas/ranking?periodo=${periodo}`)
export const getRankingDetalle  = (periodo) => request('GET', `/estadisticas/ranking-detalle?periodo=${periodo}`)
export const getCancelados      = (periodo) => request('GET', `/estadisticas/cancelados?periodo=${periodo}`)
export const getPlacas          = (buscar = '') => request('GET', `/estadisticas/placas${buscar ? `?buscar=${buscar}` : ''}`)

export const registro = (datos) =>
  request('POST', '/auth/registro', datos)

// CONFIG / VEHÍCULOS CATÁLOGO
export const getConfig           = ()              => request('GET',    '/config/')
export const getVehiculos        = ()              => request('GET',    '/config/vehiculos')
export const crearVehiculo       = (data)          => request('POST',   '/config/vehiculos', data)
export const actualizarVehiculo  = (id, data)      => request('PATCH',  `/config/vehiculos/${id}`, data)
export const eliminarVehiculo    = (id)            => request('DELETE', `/config/vehiculos/${id}`)
export const actualizarPerfil    = (data)          => request('PATCH',  '/config/perfil', data)

// CAJA
export const getResumenCaja = (inicio, fin) => {
  const params = new URLSearchParams()
  if (inicio) params.append('fecha_inicio', inicio)
  if (fin) params.append('fecha_fin', fin)
  return request('GET', `/caja/resumen?${params.toString()}`)
}
export const getEgresos = (fecha) => {
  const params = new URLSearchParams()
  if (fecha) params.append('fecha', fecha)
  return request('GET', `/caja/egresos?${params.toString()}`)
}
export const crearEgreso = (concepto, monto) => request('POST', '/caja/egresos', { concepto, monto: parseInt(monto) })
export const eliminarEgreso = (id) => request('DELETE', `/caja/egresos/${id}`)

// CIERRE DE CAJA
export const getCierreCaja = (fecha) => request('GET', `/caja/cierre/${fecha}`)
export const getCierresCaja = () => request('GET', '/caja/cierres')
export const crearCierreCaja = (data) => request('POST', '/caja/cierre', data)

// INVENTARIO
export const getInventario = () => request('GET', '/inventario/productos')
export const crearProducto = (data) => request('POST', '/inventario/productos', data)
export const editarProducto = (id, data) => request('PATCH', `/inventario/productos/${id}`, data)
export const eliminarProducto = (id) => request('DELETE', `/inventario/productos/${id}`)

// RECETAS (AUTOMATIZACIÓN)
export const getRecetas = () => request('GET', '/inventario/recetas')
export const crearReceta = (data) => request('POST', '/inventario/recetas', data)
export const eliminarReceta = (id) => request('DELETE', `/inventario/recetas/${id}`)

// MOVIMIENTOS INVENTARIO
export const getMovimientosInventario = () => request('GET', '/inventario/movimientos')
export const crearMovimientoInventario = (data) => request('POST', '/inventario/movimientos', data)

// SUPER ADMIN
export const getTodosLavaderos = () => request('GET', '/superadmin/lavaderos')
export const actualizarEstadoLavadero = (id, estado) => request('PATCH', `/superadmin/lavaderos/${id}/estado`, { estado_suscripcion: estado })
