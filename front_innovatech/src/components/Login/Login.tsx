import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import { formatRut, validateRut } from '../../utils/rutUtils';
import { getRoleFromToken, useAuth } from '../../context/AuthContext';
import './Login.css';

function getRedirectPath(rol: string | null): string {
  if (rol === 'ADMINISTRADOR') return '/analiticas';
  if (rol === 'GESTOR_PROYECTOS') return '/gestor';
  return '/user';
}

const Login: React.FC = () => {
  const [rut, setRut] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const rol = getRoleFromToken();
      navigate(getRedirectPath(rol), { replace: true });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRut(rut)) {
      setError('El RUT ingresado no es válido. Verifica el formato.');
      return;
    }

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

      localStorage.setItem('token', data.token);
      refreshUser(); // sincroniza AuthContext antes de navegar

      const rol = getRoleFromToken();
      navigate(getRedirectPath(rol));
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

        {error && <Alert variant="danger" className="mb-4 py-2 small">{error}</Alert>}

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-4" controlId="formBasicRUT">
            <Form.Label className="login-label">RUT</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: 12.345.678-9"
              className="login-input"
              value={rut}
              onChange={(e) => setRut(formatRut(e.target.value))}
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
        </Form>
      </div>
    </div>
  );
};

export default Login;
