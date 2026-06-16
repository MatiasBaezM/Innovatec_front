import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Tarjeta de cambio de contraseña reutilizable (colaboradores y gestores).
 *
 * Antes de cambiar la clave valida que:
 *  - La contraseña actual sea correcta (se verifica contra /auth/login).
 *  - La nueva contraseña y su confirmación coincidan.
 */
const MIN_LEN = 4;

const ChangePasswordCard: React.FC = () => {
  const { userInfo } = useAuth();
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (form.nueva.length < MIN_LEN) {
      setMsg({ type: 'danger', text: `La nueva contraseña debe tener al menos ${MIN_LEN} caracteres.` });
      return;
    }
    if (form.nueva !== form.confirmar) {
      setMsg({ type: 'danger', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }
    if (form.nueva === form.actual) {
      setMsg({ type: 'danger', text: 'La nueva contraseña debe ser distinta a la actual.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Verifica que la contraseña actual sea correcta
      const loginRes = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: userInfo?.rut, clave: form.actual }),
      });
      if (!loginRes.ok) {
        setMsg({ type: 'danger', text: 'La contraseña actual es incorrecta.' });
        setLoading(false);
        return;
      }

      // 2. Obtiene el id del usuario autenticado
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      let userId = userInfo?.id;
      if (!userId) {
        const me = await fetch(API_ENDPOINTS.AUTH.ME, { headers }).then(r => r.ok ? r.json() : null).catch(() => null);
        userId = me?.id;
      }
      if (!userId) throw new Error();

      // 3. Actualiza la contraseña
      const res = await fetch(`${API_ENDPOINTS.AUTH.USERS}/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ clave: form.nueva }),
      });
      if (!res.ok) throw new Error();

      setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setForm({ actual: '', nueva: '', confirmar: '' });
    } catch {
      setMsg({ type: 'danger', text: 'No se pudo cambiar la contraseña. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <Lock size={18} style={{ color: '#6366f1' }} />
          <h5 className="mb-0 fw-bold">Cambiar Contraseña</h5>
        </div>

        {msg.text && <Alert variant={msg.type} className="py-2 small">{msg.text}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña actual <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password" name="actual" value={form.actual}
              onChange={handleChange} required autoComplete="current-password"
              placeholder="••••••••"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Nueva contraseña <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password" name="nueva" value={form.nueva}
              onChange={handleChange} required minLength={MIN_LEN} autoComplete="new-password"
              placeholder="••••••••"
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Confirmar nueva contraseña <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password" name="confirmar" value={form.confirmar}
              onChange={handleChange} required minLength={MIN_LEN} autoComplete="new-password"
              placeholder="••••••••"
              isInvalid={form.confirmar.length > 0 && form.confirmar !== form.nueva}
            />
            <Form.Control.Feedback type="invalid">Las contraseñas no coinciden.</Form.Control.Feedback>
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button
              type="submit"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none' }}
            >
              <Save size={14} className="me-2" />
              {loading ? 'Guardando...' : 'Actualizar Contraseña'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ChangePasswordCard;
