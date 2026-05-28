import React from 'react';
import { Row, Col, Card, Form, Button, Alert, Table } from 'react-bootstrap';
import { User, Download, Activity, Save, FileText, Users } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import './Config.css';

interface Actividad {
  id: number;
  titulo: string;
  fechaCreacion: string;
}

function downloadCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const content = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const Config: React.FC = () => {
  const [perfil, setPerfil] = React.useState({
    id: 0, nombre: '', correo: '', clave: '', rut: '', rol: '',
  });
  const [perfilMsg, setPerfilMsg] = React.useState({ type: '', text: '' });
  const [perfilLoading, setPerfilLoading] = React.useState(false);

  const [actividades, setActividades] = React.useState<Actividad[]>([]);
  const [actLoading, setActLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(API_ENDPOINTS.AUTH.ME, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setPerfil({
            id: data.id,
            nombre: data.nombre ?? '',
            correo: data.correo ?? '',
            clave: '',
            rut: data.rut ?? '',
            rol: data.rol ?? '',
          });
        }
      });

    fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setActividades(Array.isArray(data) ? data : []))
      .finally(() => setActLoading(false));
  }, []);

  const handlePerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPerfil(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setPerfilLoading(true);
    setPerfilMsg({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const body: Record<string, string> = {
        nombre: perfil.nombre,
        correo: perfil.correo,
        rut: perfil.rut,
        rol: perfil.rol,
      };
      if (perfil.clave) body.clave = perfil.clave;

      const res = await fetch(`${API_ENDPOINTS.AUTH.USERS}/${perfil.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setPerfilMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
      setPerfil(prev => ({ ...prev, clave: '' }));
    } catch {
      setPerfilMsg({ type: 'danger', text: 'No se pudo actualizar el perfil. Intenta nuevamente.' });
    } finally {
      setPerfilLoading(false);
    }
  };

  const exportarUsuarios = async () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const data = await fetch(API_ENDPOINTS.AUTH.USERS, { headers })
      .then(r => r.json()).catch(() => []);
    downloadCSV('usuarios.csv',
      ['ID', 'Nombre', 'RUT', 'Rol', 'Correo'],
      (data as any[]).map(u => [u.id, u.nombre, u.rut, u.rol, u.correo ?? ''])
    );
  };

  const exportarProyectos = async () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const data = await fetch(API_ENDPOINTS.PROJECTS.BASE, { headers })
      .then(r => r.json()).catch(() => []);
    downloadCSV('proyectos.csv',
      ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Inicio', 'Fecha Fin'],
      (data as any[]).map(p => [p.id, p.nombre, p.descripcion, p.estado, p.fechaInicio ?? '', p.fechaFin ?? ''])
    );
  };

  return (
    <div className="config-page">
      <header className="mb-5">
        <h1 className="config-title">Configuración</h1>
        <p className="text-muted">Gestiona tu perfil y las opciones del sistema.</p>
      </header>

      <Row className="g-4">

        {/* ── Mi Perfil ── */}
        <Col lg={6}>
          <Card className="config-card border-0">
            <Card.Body className="p-4">
              <div className="config-section-header">
                <div className="config-section-icon" style={{ background: '#6366f118', color: '#6366f1' }}>
                  <User size={18} />
                </div>
                <h6 className="config-section-title">Mi Perfil</h6>
              </div>

              {perfilMsg.text && (
                <Alert variant={perfilMsg.type} className="py-2 small mt-3 mb-3">
                  {perfilMsg.text}
                </Alert>
              )}

              <Form onSubmit={handleGuardar} className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label className="config-label">Nombre completo</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={perfil.nombre}
                    onChange={handlePerfilChange}
                    className="config-input"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="config-label">RUT</Form.Label>
                  <Form.Control
                    type="text"
                    value={perfil.rut}
                    className="config-input"
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="config-label">Correo electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    name="correo"
                    value={perfil.correo}
                    onChange={handlePerfilChange}
                    className="config-input"
                    placeholder="correo@empresa.com"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="config-label">
                    Nueva contraseña
                    <span className="config-label-hint">dejar vacío para no cambiar</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="clave"
                    value={perfil.clave}
                    onChange={handlePerfilChange}
                    className="config-input"
                    placeholder="••••••••"
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button
                    type="submit"
                    className="config-save-btn"
                    disabled={perfilLoading || !perfil.id}
                  >
                    <Save size={14} className="me-2" />
                    {perfilLoading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Exportar Datos ── */}
        <Col lg={6}>
          <Card className="config-card border-0">
            <Card.Body className="p-4">
              <div className="config-section-header">
                <div className="config-section-icon" style={{ background: '#10b98118', color: '#10b981' }}>
                  <Download size={18} />
                </div>
                <h6 className="config-section-title">Exportar Datos</h6>
              </div>
              <p className="text-muted small mt-3 mb-4">
                Descarga la información del sistema en formato CSV.
              </p>

              <div className="config-export-item">
                <div className="config-export-icon" style={{ background: '#6366f118', color: '#6366f1' }}>
                  <Users size={18} />
                </div>
                <div className="config-export-info">
                  <div className="config-export-name">Usuarios del sistema</div>
                  <div className="config-export-desc">ID, Nombre, RUT, Rol, Correo</div>
                </div>
                <Button variant="outline-primary" className="config-dl-btn" onClick={exportarUsuarios}>
                  <Download size={13} className="me-1" />CSV
                </Button>
              </div>

              <div className="config-divider" />

              <div className="config-export-item">
                <div className="config-export-icon" style={{ background: '#10b98118', color: '#10b981' }}>
                  <FileText size={18} />
                </div>
                <div className="config-export-info">
                  <div className="config-export-name">Proyectos</div>
                  <div className="config-export-desc">ID, Nombre, Descripción, Estado, Fechas</div>
                </div>
                <Button variant="outline-success" className="config-dl-btn" onClick={exportarProyectos}>
                  <Download size={13} className="me-1" />CSV
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Registro de Actividad ── */}
        <Col lg={12}>
          <Card className="config-card border-0">
            <Card.Body className="p-4">
              <div className="config-section-header">
                <div className="config-section-icon" style={{ background: '#8b5cf618', color: '#8b5cf6' }}>
                  <Activity size={18} />
                </div>
                <h6 className="config-section-title">Registro de Actividad</h6>
              </div>

              {actLoading ? (
                <p className="text-muted small mt-3">Cargando actividades...</p>
              ) : actividades.length === 0 ? (
                <p className="text-muted small mt-3">No hay actividad registrada.</p>
              ) : (
                <div className="config-table-wrapper mt-3">
                  <Table responsive className="config-activity-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>Descripción</th>
                        <th style={{ width: 180 }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividades.map((a, i) => (
                        <tr key={a.id ?? i}>
                          <td className="text-muted">#{a.id}</td>
                          <td>{a.titulo}</td>
                          <td className="text-muted text-nowrap">
                            {new Date(a.fechaCreacion).toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default Config;
