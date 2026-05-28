import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Landing         from './pages/Landing'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Demo            from './pages/Demo'
import ForgotPassword  from './pages/ForgotPassword'
import ForgotPins      from './pages/ForgotPins'
import ResetPassword   from './pages/ResetPassword'
import ResetPins       from './pages/ResetPins'

import AppLayout    from './components/AppLayout'
import Dashboard    from './pages/app/Dashboard'
import Nuevo        from './pages/app/Nuevo'
import Historial    from './pages/app/Historial'
import Estadisticas from './pages/app/Estadisticas'
import Vehiculos    from './pages/app/Vehiculos'
import Empleados    from './pages/app/Empleados'
import Config       from './pages/app/Config'
import Caja         from './pages/app/Caja'
import Inventario   from './pages/app/Inventario'
import SuperAdmin   from './pages/app/SuperAdmin'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-pins" element={<ForgotPins />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-pins/:token" element={<ResetPins />} />
          <Route path="/demo"     element={<Demo />} />
          
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index               element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="nuevo"        element={<Nuevo />} />
            <Route path="historial"    element={<Historial />} />
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="vehiculos"    element={<Vehiculos />} />
            <Route path="empleados"    element={<Empleados />} />
            <Route path="config"       element={<Config />} />
            <Route path="caja"         element={<Caja />} />
            <Route path="inventario"   element={<Inventario />} />
          </Route>

          <Route path="/superadmin" element={
            <ProtectedRoute>
              <SuperAdmin />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}