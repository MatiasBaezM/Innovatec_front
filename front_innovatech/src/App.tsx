import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login/Login'
import AdminLayout from './components/Admin/AdminLayout'
import Dashboard from './components/Admin/Dashboard'
import UsersManagement from './components/Admin/UsersManagement'
import ProjectsManagement from './components/Admin/ProjectsManagement'
import Config from './components/Admin/Config'
import UserLayout from './components/User/UserLayout'
import UserDashboard from './components/User/UserDashboard'
import UserProjects from './components/User/UserProjects'
import UserProfile from './components/User/UserProfile'
import TaskBoard from './components/User/TaskBoard'
import GestorLayout from './components/Gestor/GestorLayout'
import GestorProjects from './components/Gestor/GestorProjects'
import GestorTaskBoard from './components/Gestor/GestorTaskBoard'
import { getRoleFromToken } from './context/AuthContext'
import './App.css'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  const rol = getRoleFromToken();
  if (rol === 'GESTOR_PROYECTOS') return <Navigate to="/gestor" replace />;
  if (rol !== 'ADMINISTRADOR') return <Navigate to="/user" replace />;
  return <>{children}</>;
};

const GestorRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  const rol = getRoleFromToken();
  if (rol === 'ADMINISTRADOR') return <Navigate to="/analiticas" replace />;
  if (rol !== 'GESTOR_PROYECTOS') return <Navigate to="/user" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas de administrador */}
      <Route path="/dashboard" element={<Navigate to="/analiticas" replace />} />
      <Route
        path="/analiticas"
        element={
          <AdminRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <AdminRoute>
            <AdminLayout>
              <UsersManagement />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/proyectos"
        element={
          <AdminRoute>
            <AdminLayout>
              <ProjectsManagement />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/config"
        element={
          <AdminRoute>
            <AdminLayout>
              <Config />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Rutas de gestor de proyectos */}
      <Route
        path="/gestor"
        element={
          <GestorRoute>
            <GestorLayout>
              <GestorProjects />
            </GestorLayout>
          </GestorRoute>
        }
      />
      <Route
        path="/gestor/proyectos"
        element={
          <GestorRoute>
            <GestorLayout>
              <GestorProjects />
            </GestorLayout>
          </GestorRoute>
        }
      />
      <Route
        path="/gestor/proyectos/:id"
        element={
          <GestorRoute>
            <GestorLayout>
              <GestorTaskBoard />
            </GestorLayout>
          </GestorRoute>
        }
      />

      {/* Rutas de colaborador */}
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserLayout>
              <UserDashboard />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/proyectos"
        element={
          <ProtectedRoute>
            <UserLayout>
              <UserProjects />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/perfil"
        element={
          <ProtectedRoute>
            <UserLayout>
              <UserProfile />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/proyectos/:id"
        element={
          <ProtectedRoute>
            <UserLayout>
              <TaskBoard />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
