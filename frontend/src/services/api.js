const BASE = 'http://127.0.0.1:8000'

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

// LAVADOS
export const getLavados = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return request('GET', `/lavados/?${q}`)
}
export const crearLavado   = (data) => request('POST', '/lavados/', data)
export const eliminarLavado = (id)  => request('DELETE', `/lavados/${id}`)

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
export const getRanking         = (periodo) => request('GET', `/estadisticas/ranking?periodo=${periodo}`)
export const getPlacas          = (buscar = '') => request('GET', `/estadisticas/placas${buscar ? `?buscar=${buscar}` : ''}`)

export const registro = (datos) =>
  request('POST', '/auth/registro', datos)