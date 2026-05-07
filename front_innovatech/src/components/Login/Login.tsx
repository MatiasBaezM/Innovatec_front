import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación real contra el MS Autenticación
    console.log('Intento de login:', { nombre, rut });
    
    // Simulamos un login exitoso y redirigimos al inicio de la app
    navigate('/home');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Innovatech</h2>
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-4" controlId="formBasicName">
            <Form.Label className="login-label">Nombre Completo</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Ingresa tu nombre" 
              className="login-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Form.Group>

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

          <Button variant="primary" type="submit" className="w-100 login-btn">
            Iniciar Sesión
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Login;
