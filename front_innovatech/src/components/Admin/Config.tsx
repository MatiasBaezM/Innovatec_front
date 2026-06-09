import React from 'react';
import { Row, Col, Card, Form, Button, Alert, Table, Modal, Badge } from 'react-bootstrap';
import { User, Download, Activity, Save, FileText, Users, Tag, Pencil, Trash2, Plus } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import {
  type Habilidad,
  COLORES_SKILLS,
  loadSkillsFromStorage,
  saveSkillsToStorage,
} from '../../utils/skillsUtils';
import './Config.css';

// ── Actividades ──────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
const Config: React.FC = () => {
  // Perfil
  const [perfil, setPerfil] = React.useState({ id: 0, nombre: '', correo: '', clave: '', rut: '', rol: '' });
  const [perfilMsg, setPerfilMsg] = React.useState({ type: '', text: '' });
  const [perfilLoading, setPerfilLoading] = React.useState(false);

  // Actividades
  const [actividades, setActividades] = React.useState<Actividad[]>([]);
  const [actLoading, setActLoading] = React.useState(true);

  // Habilidades
  const [habilidades, setHabilidades] = React.useState<Habilidad[]>([]);
  const [showSkillModal, setShowSkillModal] = React.useState(false);
  const [editingSkill, setEditingSkill] = React.useState<Habilidad | null>(null);
  const [skillForm, setSkillForm] = React.useState({ nombre: '', color: '#6366f1' });
  const [skillMsg, setSkillMsg] = React.useState({ type: '', text: '' });
  const [showDeleteSkill, setShowDeleteSkill] = React.useState<number | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(API_ENDPOINTS.AUTH.ME, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setPerfil({ id: data.id, nombre: data.nombre ?? '', correo: data.correo ?? '', clave: '', rut: data.rut ?? '', rol: data.rol ?? '' });
      });

    fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setActividades(Array.isArray(data) ? data : []))
      .finally(() => setActLoading(false));

    setHabilidades(loadSkillsFromStorage());
  }, []);

  // ── Perfil handlers ──
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
      const body: Record<string, string> = { nombre: perfil.nombre, correo: perfil.correo, rut: perfil.rut, rol: perfil.rol };
      if (perfil.clave) body.clave = perfil.clave;
      const res = await fetch(`${API_ENDPOINTS.AUTH.USERS}/${perfil.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setPerfilMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
      setPerfil(prev => ({ ...prev, clave: '' }));
    } catch {
      setPerfilMsg({ type: 'danger', text: 'No se pudo actualizar el perfil. Intenta nuevamente.' });
    } finally { setPerfilLoading(false); }
  };

  // ── Export handlers ──
  const exportarUsuarios = async () => {
    const token = localStorage.getItem('token');
    const data = await fetch(API_ENDPOINTS.AUTH.USERS, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []);
    downloadCSV('usuarios.csv', ['ID', 'Nombre', 'RUT', 'Rol', 'Correo'], (data as any[]).map(u => [u.id, u.nombre, u.rut, u.rol, u.correo ?? '']));
  };

  const exportarProyectos = async () => {
    const token = localStorage.getItem('token');
    const data = await fetch(API_ENDPOINTS.PROJECTS.BASE, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []);
    downloadCSV('proyectos.csv', ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Inicio', 'Fecha Fin'], (data as any[]).map(p => [p.id, p.nombre, p.descripcion, p.estado, p.fechaInicio ?? '', p.fechaFin ?? '']));
  };

  // ── Habilidades handlers ──
  const openSkillModal = (skill?: Habilidad) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillForm({ nombre: skill.nombre, color: skill.color });
    } else {
      setEditingSkill(null);
      setSkillForm({ nombre: '', color: '#6366f1' });
    }
    setSkillMsg({ type: '', text: '' });
    setShowSkillModal(true);
  };

  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.nombre.trim()) return;
    let updated: Habilidad[];
    if (editingSkill) {
      updated = habilidades.map(h => h.id === editingSkill.id ? { ...editingSkill, ...skillForm, nombre: skillForm.nombre.trim() } : h);
    } else {
      updated = [...habilidades, { id: Date.now(), nombre: skillForm.nombre.trim(), color: skillForm.color }];
    }
    setHabilidades(updated);
    saveSkillsToStorage(updated);
    setSkillMsg({ type: 'success', text: `Habilidad ${editingSkill ? 'actualizada' : 'creada'} correctamente.` });
    setTimeout(() => setShowSkillModal(false), 900);
  };

  const handleDeleteSkill = (id: number) => {
    const updated = habilidades.filter(h => h.id !== id);
    setHabilidades(updated);
    saveSkillsToStorage(updated);
    setShowDeleteSkill(null);
  };

  return (
    <div className="config-page">
      <header className="mb-5">
        <h1 className="config-title">Configuración</h1>
        <p className="text-muted">Gestiona tu perfil, habilidades y opciones del sistema.</p>
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
              {perfilMsg.text && <Alert variant={perfilMsg.type} className="py-2 small mt-3 mb-3">{perfilMsg.text}</Alert>}
              <Form onSubmit={handleGuardar} className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label className="config-label">Nombre completo</Form.Label>
                  <Form.Control type="text" name="nombre" value={perfil.nombre} onChange={handlePerfilChange} className="config-input" required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="config-label">RUT</Form.Label>
                  <Form.Control type="text" value={perfil.rut} className="config-input" disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="config-label">Correo electrónico</Form.Label>
                  <Form.Control type="email" name="correo" value={perfil.correo} onChange={handlePerfilChange} className="config-input" placeholder="correo@empresa.com" />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="config-label">
                    Nueva contraseña
                    <span className="config-label-hint">dejar vacío para no cambiar</span>
                  </Form.Label>
                  <Form.Control type="password" name="clave" value={perfil.clave} onChange={handlePerfilChange} className="config-input" placeholder="••••••••" />
                </Form.Group>
                <div className="d-flex justify-content-end">
                  <Button type="submit" className="config-save-btn" disabled={perfilLoading || !perfil.id}>
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
              <p className="text-muted small mt-3 mb-4">Descarga la información del sistema en formato Excel.</p>
              <div className="config-export-item">
                <div className="config-export-icon" style={{ background: '#6366f118', color: '#6366f1' }}><Users size={18} /></div>
                <div className="config-export-info">
                  <div className="config-export-name">Usuarios del sistema</div>
                  <div className="config-export-desc">ID, Nombre, RUT, Rol, Correo</div>
                </div>
                <Button variant="outline-primary" className="config-dl-btn" onClick={exportarUsuarios}><Download size={13} className="me-1" />Excel</Button>
              </div>
              <div className="config-divider" />
              <div className="config-export-item">
                <div className="config-export-icon" style={{ background: '#10b98118', color: '#10b981' }}><FileText size={18} /></div>
                <div className="config-export-info">
                  <div className="config-export-name">Proyectos</div>
                  <div className="config-export-desc">ID, Nombre, Descripción, Estado, Fechas</div>
                </div>
                <Button variant="outline-success" className="config-dl-btn" onClick={exportarProyectos}><Download size={13} className="me-1" />Excel</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ── Gestión de Habilidades ── */}
        <Col lg={12}>
          <Card className="config-card border-0">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="config-section-header">
                  <div className="config-section-icon" style={{ background: '#f59e0b18', color: '#f59e0b' }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <h6 className="config-section-title">Gestión de Habilidades</h6>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                      Define las habilidades disponibles para asignar a colaboradores.
                    </p>
                  </div>
                </div>
                <Button
                  className="config-save-btn d-flex align-items-center gap-2"
                  onClick={() => openSkillModal()}
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                >
                  <Plus size={16} /> Nueva Habilidad
                </Button>
              </div>

              {habilidades.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <Tag size={32} className="mb-2 opacity-25" />
                  <p className="mb-0">No hay habilidades definidas aún.</p>
                </div>
              ) : (
                <div className="config-table-wrapper">
                  <Table responsive className="config-activity-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>#</th>
                        <th>Habilidad</th>
                        <th style={{ width: 120 }}>Color</th>
                        <th className="text-end" style={{ width: 100 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {habilidades.map((h, i) => (
                        <tr key={h.id}>
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <span style={{ color: h.color, fontWeight: 600, fontSize: '0.875rem' }}>
                              {h.nombre}
                            </span>
                          </td>
                          <td>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: h.color }} />
                          </td>
                          <td className="text-end">
                            <Button variant="link" className="p-1" style={{ color: '#f59e0b' }} onClick={() => openSkillModal(h)} title="Editar">
                              <Pencil size={15} />
                            </Button>
                            <Button variant="link" className="p-1" style={{ color: '#ef4444' }} onClick={() => setShowDeleteSkill(h.id)} title="Eliminar">
                              <Trash2 size={15} />
                            </Button>
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

      {/* ── Modal: Crear / Editar Habilidad ── */}
      <Modal show={showSkillModal} onHide={() => setShowSkillModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <Tag size={18} style={{ color: '#f59e0b' }} />
            {editingSkill ? 'Editar Habilidad' : 'Nueva Habilidad'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSkill}>
          <Modal.Body>
            {skillMsg.text && <Alert variant={skillMsg.type} className="py-2 small">{skillMsg.text}</Alert>}
            <Form.Group className="mb-4">
              <Form.Label className="config-label">Nombre de la habilidad <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                className="config-input"
                value={skillForm.nombre}
                onChange={e => setSkillForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Desarrollador Backend"
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="config-label">Color de identificación</Form.Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.25rem' }}>
                {COLORES_SKILLS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSkillForm(prev => ({ ...prev, color: c }))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: c,
                      border: skillForm.color === c ? '3px solid #0f172a' : '3px solid transparent',
                      outline: skillForm.color === c ? `2px solid ${c}` : 'none',
                      cursor: 'pointer', transition: 'transform .15s ease',
                      transform: skillForm.color === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <div className="d-flex align-items-center gap-2 mt-3">
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: skillForm.color, flexShrink: 0 }} />
                <Badge style={{ backgroundColor: skillForm.color + '22', color: skillForm.color, border: `1px solid ${skillForm.color}44`, fontWeight: 600 }}>
                  {skillForm.nombre || 'Vista previa'}
                </Badge>
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSkillModal(false)}>Cancelar</Button>
            <Button
              type="submit"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', borderRadius: '10px', fontWeight: 600 }}
            >
              {editingSkill ? 'Guardar Cambios' : 'Crear Habilidad'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal: Confirmar eliminación ── */}
      <Modal show={showDeleteSkill !== null} onHide={() => setShowDeleteSkill(null)} centered>
        <Modal.Header closeButton><Modal.Title>Eliminar Habilidad</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas eliminar la habilidad{' '}
            <strong>{habilidades.find(h => h.id === showDeleteSkill)?.nombre}</strong>?
          </p>
          <p className="text-muted small">Se eliminará de todos los colaboradores que la tengan asignada.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteSkill(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => showDeleteSkill !== null && handleDeleteSkill(showDeleteSkill)}>Eliminar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Config;
