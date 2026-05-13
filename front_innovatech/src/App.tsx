import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login/Login'
import AdminLayout from './components/Admin/AdminLayout'
import Dashboard from './components/Admin/Dashboard'
import UsersManagement from './components/Admin/UsersManagement'
import ProjectsManagement from './components/Admin/ProjectsManagement'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        } 
      />
      <Route 
        path="/usuarios" 
        element={
          <AdminLayout>
            <UsersManagement />
          </AdminLayout>
        } 
      />
      <Route 
        path="/proyectos" 
        element={
          <AdminLayout>
            <ProjectsManagement />
          </AdminLayout>
        } 
      />
      {/* Redireccionar a la raíz por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

