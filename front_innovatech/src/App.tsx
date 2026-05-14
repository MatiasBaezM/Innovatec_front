import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login/Login'
import AdminLayout from './components/Admin/AdminLayout'
import Dashboard from './components/Admin/Dashboard'
import UsersManagement from './components/Admin/UsersManagement'
import ProjectsManagement from './components/Admin/ProjectsManagement'
import './App.css'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Redirigir al login si no hay token, guardando la ruta de origen
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UsersManagement />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/proyectos" 
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProjectsManagement />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      {/* Redireccionar a la raíz por defecto, que a su vez redirigirá al login si no hay sesión */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
