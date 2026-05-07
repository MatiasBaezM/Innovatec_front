import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login/Login'
import './App.css'

// Placeholder for Home component
const Home = () => (
  <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
    <h1>Bienvenido a Innovatech</h1>
    <p>Has iniciado sesión exitosamente.</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      {/* Redireccionar a login por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
