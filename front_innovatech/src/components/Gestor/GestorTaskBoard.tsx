import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { ArrowLeft, FolderKanban, CheckCircle, XCircle, AlertTriangle, Plus } from 'lucide-react';
import API_BASE_URL, { API_ENDPOINTS } from '../../config/api';
import '../User/TaskBoard.css';

interface Tarea {
  id: number;
  proyectoId?: number;
  titulo: string;
  descripcion: string;
  estado: 'POR_HACER' | 'EN_PROGRESO' | 'COMPLETADO' | 'REVISADO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  asignadoId?: number;
  asignadoNombre?: string;
  fechaCreacion?: string;
  fechaLimite?: string;
  mensajeCorreccion?: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  estado: string;
}

interface Colaborador {
  id: number;
  nombre: string;
}

const PRIORIDAD_CONFIG = {
  ALTA:  { label: 'Alta',  color: '#b91c1c', bg: '#fee2e2' },
  MEDIA: { label: 'Media', color: '#92400e', bg: '#fef3c7' },
  BAJA:  { label: 'Baja',  color: '#065f46', bg: '#d1fae5' },
};

const ESTADO_PROYECTO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INICIO:      { label: 'Inicio',      color: '#92400e', bg: '#fef3c7' },
  EN_PROGRESO: { label: 'En Progreso', color: '#3730a3', bg: '#ede9fe' },
  FINALIZADO:  { label: 'Finalizado',  color: '#065f46', bg: '#d1fae5' },
};

const COLUMNAS: { key: Tarea['estado']; label: string; color: string; readonly?: boolean }[] = [
  { key: 'POR_HACER',   label: 'Por Hacer',   color: '#64748b' },
  { key: 'EN_PROGRESO', label: 'En Progreso', color: '#6366f1' },
  { key: 'COMPLETADO',  label: 'Completado',  color: '#10b981' },
  { key: 'REVISADO',    label: 'Revisado',    color: '#8b5cf6', readonly: true },
];

const hoy = () => new Date().toISOString().split('T')[0];

function emptyForm(proyectoId: number) {
  return {
    proyectoId,
    titulo: '',
    descripcion: '',
    fechaCreacion: hoy(),
    fechaLimite: '',
    asignadoId: 0,
    asignadoNombre: '',
    prioridad: 'MEDIA' as Tarea['prioridad'],
    estado: 'POR_HACER' as Tarea['estado'],
  };
}

function getInitials(nombre: string) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const GestorTaskBoard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const proyectoId = Number(id);

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag & drop
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<Tarea['estado'] | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  // Modal: nueva tarea
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyForm(proyectoId));
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskMsg, setTaskMsg] = useState({ type: '', text: '' });

  // Modal: rechazo
  const [rejectionModal, setRejectionModal] = useState<{
    open: boolean; tarea: Tarea | null; mensaje: string;
  }>({ open: false, tarea: null, mensaje: '' });

  // ── Carga inicial ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}`, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => ({ id: proyectoId, nombre: `Proyecto ${proyectoId}`, estado: 'EN_PROGRESO' })),
      fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}/tareas`, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => [] as Tarea[]),
    ]).then(([pData, tData]) => {
      setProyecto(pData);
      setTareas(tData);
    }).finally(() => setLoading(false));

    // Cargar colaboradores del equipo del proyecto
    fetch(API_ENDPOINTS.AUTH.USERS, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((all: any[]) => setColaboradores(all.filter(u => u.rol === 'COLABORADOR')))
      .catch(() => setColaboradores([
        { id: 1, nombre: 'Juan Pérez' },
        { id: 2, nombre: 'María Silva' },
        { id: 3, nombre: 'Carlos Ruiz' },
      ]));
  }, [proyectoId]);

  // ── Drag & drop ───────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, tareaId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('tareaId', String(tareaId));
    setTimeout(() => setDraggedId(tareaId), 0);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverCol(null);
    dragCounter.current = {};
  };

  const handleColDragEnter = (e: React.DragEvent, colKey: Tarea['estado']) => {
    e.preventDefault();
    dragCounter.current[colKey] = (dragCounter.current[colKey] ?? 0) + 1;
    setOverCol(colKey);
  };

  const handleColDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColDragLeave = (_e: React.DragEvent, colKey: Tarea['estado']) => {
    dragCounter.current[colKey] = (dragCounter.current[colKey] ?? 1) - 1;
    if (dragCounter.current[colKey] <= 0) {
      dragCounter.current[colKey] = 0;
      setOverCol(prev => prev === colKey ? null : prev);
    }
  };

  const handleDrop = (e: React.DragEvent, colKey: Tarea['estado']) => {
    e.preventDefault();
    if (colKey === 'REVISADO') return;
    const tareaId = Number(e.dataTransfer.getData('tareaId'));
    if (!tareaId) return;
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea || tarea.estado === colKey) return;

    const mensajeCorreccion = colKey === 'COMPLETADO' ? undefined : tarea.mensajeCorreccion;
    const tareaActualizada = { ...tarea, estado: colKey, mensajeCorreccion };
    setTareas(prev => prev.map(t => t.id === tareaId ? tareaActualizada : t));
    setDraggedId(null);
    setOverCol(null);
    dragCounter.current = {};

    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/proyectos/${tarea.proyectoId ?? id}/tareas/${tareaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(tareaActualizada),
    }).catch(() => setTareas(prev => prev.map(t => t.id === tareaId ? tarea : t)));
  };

  // ── Crear tarea ───────────────────────────────────────────────
  const openTaskModal = () => {
    setTaskForm(emptyForm(proyectoId));
    setTaskMsg({ type: '', text: '' });
    setShowTaskModal(true);
  };

  const handleTaskFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    if (name === 'asignadoId') {
      const colab = colaboradores.find(c => c.id.toString() === value);
      setTaskForm(prev => ({ ...prev, asignadoId: Number(value), asignadoNombre: colab?.nombre ?? '' }));
    } else {
      setTaskForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.asignadoId) {
      setTaskMsg({ type: 'danger', text: 'Debes seleccionar un colaborador.' });
      return;
    }
    setTaskLoading(true);
    const nueva: Tarea = { ...taskForm, id: Date.now() };
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(nueva),
      });
      if (res.ok) {
        const created: Tarea = await res.json();
        setTareas(prev => [...prev, created]);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback local
      setTareas(prev => [...prev, nueva]);
    }

    setTaskMsg({ type: 'success', text: `Tarea asignada a ${nueva.asignadoNombre}.` });
    setTimeout(() => {
      setShowTaskModal(false);
      setTaskMsg({ type: '', text: '' });
    }, 1100);
    setTaskLoading(false);
  };

  // ── Validación ────────────────────────────────────────────────
  const handleApprove = async (tarea: Tarea) => {
    const updated: Tarea = { ...tarea, estado: 'REVISADO', mensajeCorreccion: undefined };
    setTareas(prev => prev.map(t => t.id === tarea.id ? updated : t));
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/proyectos/${tarea.proyectoId ?? id}/tareas/${tarea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
    } catch {}
  };

  const handleRejection = async () => {
    const { tarea, mensaje } = rejectionModal;
    if (!tarea || !mensaje.trim()) return;
    const updated: Tarea = { ...tarea, estado: 'POR_HACER', mensajeCorreccion: mensaje.trim() };
    setTareas(prev => prev.map(t => t.id === tarea.id ? updated : t));
    setRejectionModal({ open: false, tarea: null, mensaje: '' });
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/proyectos/${tarea.proyectoId ?? id}/tareas/${tarea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
    } catch {}
  };

  const tareasPorEstado = (estado: Tarea['estado']) => tareas.filter(t => t.estado === estado);
  const estadoCfg = proyecto
    ? (ESTADO_PROYECTO_CONFIG[proyecto.estado] ?? ESTADO_PROYECTO_CONFIG.INICIO)
    : null;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="task-board">
      {/* ── Header ── */}
      <div className="tb-header">
        <button className="tb-back-btn" onClick={() => navigate('/gestor/proyectos')}>
          <ArrowLeft size={18} />
          <span>Mis Proyectos</span>
        </button>

        <div className="tb-project-info">
          <div className="tb-project-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <FolderKanban size={20} />
          </div>
          <div>
            <h1 className="tb-project-name">
              {loading ? 'Cargando...' : proyecto?.nombre ?? `Proyecto ${id}`}
            </h1>
            <p className="tb-project-sub">Todas las tareas del equipo</p>
          </div>
        </div>

        {estadoCfg && (
          <Badge className="tb-proyecto-estado" style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.color }}>
            {estadoCfg.label}
          </Badge>
        )}

        {/* Botón Nueva Tarea */}
        <button
          className="tb-new-task-btn"
          onClick={openTaskModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1.1rem',
            background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
            flexShrink: 0, transition: 'opacity .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} /> Nueva Tarea
        </button>
      </div>

      {/* ── Kanban 4 columnas ── */}
      <div className="tb-board tb-board-4col">
        {COLUMNAS.map(col => {
          const colTareas = tareasPorEstado(col.key);
          const isOver = overCol === col.key && !col.readonly;
          const isReadonly = col.readonly;

          return (
            <div
              key={col.key}
              className={`tb-column ${isOver ? 'drop-target' : ''} ${isReadonly ? 'tb-col-readonly' : ''}`}
              onDragEnter={isReadonly ? undefined : e => handleColDragEnter(e, col.key)}
              onDragOver={isReadonly ? undefined : handleColDragOver}
              onDragLeave={isReadonly ? undefined : e => handleColDragLeave(e, col.key)}
              onDrop={isReadonly ? undefined : e => handleDrop(e, col.key)}
            >
              <div className="tb-col-header">
                <div className="tb-col-dot" style={{ background: col.color }} />
                <span className="tb-col-title">{col.label}</span>
                <span className="tb-col-count">{colTareas.length}</span>
              </div>

              <div className="tb-col-body">
                {loading ? (
                  <div className="tb-col-empty">Cargando...</div>
                ) : colTareas.length === 0 ? (
                  <div className={`tb-col-empty ${isOver ? 'drop-hint' : ''}`}>
                    {isOver ? 'Soltar aquí' : 'Sin tareas'}
                  </div>
                ) : (
                  colTareas.map(tarea => {
                    const p = PRIORIDAD_CONFIG[tarea.prioridad];
                    const isDragging = draggedId === tarea.id;
                    const draggable = !isReadonly;

                    return (
                      <div
                        key={tarea.id}
                        className={`tb-task-card ${isDragging ? 'dragging' : ''} ${isReadonly ? 'tb-task-readonly' : ''}`}
                        draggable={draggable}
                        onDragStart={draggable ? e => handleDragStart(e, tarea.id) : undefined}
                        onDragEnd={draggable ? handleDragEnd : undefined}
                      >
                        <div className="tb-task-header">
                          <Badge className="tb-prioridad-badge" style={{ backgroundColor: p.bg, color: p.color }}>
                            {p.label}
                          </Badge>
                          {isReadonly
                            ? <CheckCircle size={16} color="#8b5cf6" />
                            : <div className="tb-drag-handle" title="Arrastrar"><span /><span /><span /></div>
                          }
                        </div>

                        {tarea.mensajeCorreccion && tarea.estado === 'POR_HACER' && (
                          <div className="tb-correction-msg">
                            <AlertTriangle size={13} />
                            <span>{tarea.mensajeCorreccion}</span>
                          </div>
                        )}

                        <p className="tb-task-title">{tarea.titulo}</p>
                        <p className="tb-task-desc">{tarea.descripcion}</p>

                        <div className="tb-task-footer">
                          {tarea.asignadoNombre && (
                            <div className="tb-asignado">
                              <div className="tb-asignado-avatar">{getInitials(tarea.asignadoNombre)}</div>
                              <span className="tb-asignado-nombre">{tarea.asignadoNombre}</span>
                            </div>
                          )}
                          {tarea.fechaLimite && (
                            <span className="tb-fecha">
                              {new Date(tarea.fechaLimite).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>

                        {tarea.estado === 'COMPLETADO' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              onClick={() => handleApprove(tarea)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.35rem', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#065f46', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <CheckCircle size={13} /> Aprobar
                            </button>
                            <button
                              onClick={() => setRejectionModal({ open: true, tarea, mensaje: '' })}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.35rem', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#991b1b', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <XCircle size={13} /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {isOver && colTareas.length > 0 && (
                  <div className="tb-drop-zone">Soltar aquí</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal: Nueva Tarea ── */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <Plus size={20} style={{ color: '#8b5cf6' }} />
            Nueva Tarea — {proyecto?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTask}>
          <Modal.Body>
            {taskMsg.text && <Alert variant={taskMsg.type} className="mb-3">{taskMsg.text}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Nombre de la tarea <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="titulo"
                value={taskForm.titulo}
                onChange={handleTaskFormChange}
                required
                placeholder="Ej: Diseñar pantalla de login"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={taskForm.descripcion}
                onChange={handleTaskFormChange}
                required
                placeholder="Describe qué debe realizarse..."
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Fecha de inicio</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaCreacion"
                    value={taskForm.fechaCreacion}
                    readOnly
                    style={{ background: '#f8fafc', cursor: 'default' }}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Fecha de término <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaLimite"
                    value={taskForm.fechaLimite}
                    onChange={handleTaskFormChange}
                    required
                    min={taskForm.fechaCreacion}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Colaborador a cargo <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="asignadoId"
                    value={taskForm.asignadoId || ''}
                    onChange={handleTaskFormChange}
                    required
                  >
                    <option value="">Seleccionar colaborador...</option>
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Prioridad</Form.Label>
                  <Form.Select name="prioridad" value={taskForm.prioridad} onChange={handleTaskFormChange}>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={taskLoading}
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none' }}
            >
              {taskLoading ? 'Creando...' : 'Crear y Asignar Tarea'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal: Rechazo ── */}
      <Modal show={rejectionModal.open} onHide={() => setRejectionModal({ open: false, tarea: null, mensaje: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Solicitar Correcciones</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            La tarea <strong>{rejectionModal.tarea?.titulo}</strong> será enviada de vuelta a{' '}
            <strong>Por Hacer</strong> con el siguiente mensaje para el colaborador.
          </p>
          <Form.Group>
            <Form.Label>Mensaje de correcciones <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={rejectionModal.mensaje}
              onChange={e => setRejectionModal(prev => ({ ...prev, mensaje: e.target.value }))}
              placeholder="Describe qué debe corregir el colaborador..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRejectionModal({ open: false, tarea: null, mensaje: '' })}>
            Cancelar
          </Button>
          <Button variant="danger" disabled={!rejectionModal.mensaje.trim()} onClick={handleRejection}>
            <XCircle size={16} className="me-1" />
            Rechazar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestorTaskBoard;
