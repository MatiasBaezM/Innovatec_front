import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import './Login.css';

const Login: React.FC = () => {
  const [rut, setRut] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut, clave }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      
      // Guardamos el token en localStorage
      localStorage.setItem('token', data.token);
      
      // Redirigimos al inicio
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Innovatech</h2>
        
        {error && <div className="alert alert-danger mb-4 py-2 small">{error}</div>}
        
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-4" controlId="formBasicRUT">
            <Form.Label className="login-label">RUT</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Ej: 12.345.678-9" 
              className="login-input"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formBasicClave">
            <Form.Label className="login-label">Contraseña</Form.Label>
            <Form.Control 
              type="password" 
              placeholder="Ingresa tu contraseña" 
              className="login-input"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 login-btn" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </Button>

          <div className="text-center mt-3">
            <button 
              type="button" 
              className="btn btn-link text-decoration-none text-light opacity-75"
              onClick={() => navigate('/')}
            >
              Acceso Provisorio (Omitir)
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
