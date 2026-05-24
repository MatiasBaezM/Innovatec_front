import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login/Login'
import AdminLayout from './components/Admin/AdminLayout'
import Dashboard from './components/Admin/Dashboard'
import UsersManagement from './components/Admin/UsersManagement'
import ProjectsManagement from './components/Admin/ProjectsManagement'
import UserLayout from './components/User/UserLayout'
import UserDashboard from './components/User/UserDashboard'
import UserProjects from './components/User/UserProjects'
import UserProfile from './components/User/UserProfile'
import TaskBoard from './components/User/TaskBoard'
import { useAuth } from './context/AuthContext'
import './App.css'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rutas de administrador */}
      <Route
        path="/"
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

      {/* Rutas de usuario normal */}
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
