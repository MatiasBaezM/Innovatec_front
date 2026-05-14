import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { formatRut, validateRut } from '../../utils/rutUtils';
import { API_ENDPOINTS } from '../../config/api';
import './UserRegistration.css';

const UserRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    clave: '',
    rol: 'COLABORADOR'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rut' ? formatRut(value) : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRut(formData.rut)) {
      setMessage({ type: 'danger', text: 'El RUT ingresado no es válido. Verifica que el formato sea correcto (ej. 12.345.678-9).' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar usuario');
      }

      await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: `Nuevo usuario creado: ${formData.nombre} (${formData.rol})` })
      }).catch(err => console.log('Error logging activity', err));

      setMessage({ type: 'success', text: 'Usuario registrado exitosamente' });
      setFormData({ rut: '', nombre: '', clave: '', rol: 'COLABORADOR' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-registration">
      <header className="mb-5">
        <h1 className="registration-title text-white fw-bold">Registro de Usuarios</h1>
        <p className="text-muted">Crea nuevas cuentas para el personal de Innovatech.</p>
      </header>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="registration-card border-0 shadow-lg p-4">
            {message.text && (
              <Alert variant={message.type} className="mb-4 py-2 small">
                {message.text}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="text-light small fw-bold">RUT</Form.Label>
                    <Form.Control
                      type="text"
                      name="rut"
                      placeholder="12.345.678-9"
                      value={formData.rut}
                      onChange={handleChange}
                      className="registration-input"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="text-light small fw-bold">Nombre Completo</Form.Label>
                    <Form.Control
                      type="text"
                      name="nombre"
                      placeholder="Juan Pérez"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="registration-input"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="text-light small fw-bold">Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      name="clave"
                      placeholder="********"
                      value={formData.clave}
                      onChange={handleChange}
                      className="registration-input"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="text-light small fw-bold">Rol</Form.Label>
                    <Form.Select
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      className="registration-input"
                    >
                      <option value="COLABORADOR">Colaborador</option>
                      <option value="ADMINISTRADOR">Administrador</option>
                      <option value="GESTOR_PROYECTOS">Gestor de Proyectos</option>
                      <option value="ANALISTA">Analista</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="primary"
                  type="submit"
                  className="registration-btn px-5 py-2"
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Registrar Usuario'}
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserRegistration;
