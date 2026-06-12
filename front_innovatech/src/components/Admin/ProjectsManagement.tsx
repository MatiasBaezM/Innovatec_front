import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card } from 'react-bootstrap';
import { Pencil, Trash2, Plus, Users, ClipboardList, ChevronLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import API_BASE_URL from '../../config/api';
import './ProjectsManagement.css';

interface Colaborador {
  id: number;
  nombre: string;
}

interface Proyecto {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaInicio: string;
  gestorId?: number | null;
  gestorNombre?: string | null;
  colaboradores?: Colaborador[];
}

interface Tarea {
  id: number;
  proyectoId: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaLimite: string;
  asignadoId: number;
  asignadoNombre: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  estado: 'POR_HACER' | 'EN_PROGRESO' | 'COMPLETADO' | 'REVISADO';
  mensajeCorreccion?: string;
}

const PRIORIDAD_OPTS = [
  { value: 'ALTA',  label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA',  label: 'Baja' },
];

const PRIORIDAD_CONFIG: Record<string, { color: string; bg: string }> = {
  ALTA:  { color: '#b91c1c', bg: '#fee2e2' },
  MEDIA: { color: '#92400e', bg: '#fef3c7' },
  BAJA:  { color: '#065f46', bg: '#d1fae5' },
};

function tasksKey(proyectoId: number) {
  return `innovatech_tasks_${proyectoId}`;
}

function loadLocalTasks(proyectoId: number): Tarea[] {
  try {
    return JSON.parse(localStorage.getItem(tasksKey(proyectoId)) || '[]');
  } catch { return []; }
}

function saveLocalTasks(proyectoId: number, tareas: Tarea[]) {
  localStorage.setItem(tasksKey(proyectoId), JSON.stringify(tareas));
}

const emptyTask = (proyectoId: number): Omit<Tarea, 'id'> => ({
  proyectoId,
  titulo: '',
  descripcion: '',
  fechaCreacion: new Date().toISOString().split('T')[0],
  fechaLimite: '',
  asignadoId: 0,
  asignadoNombre: '',
  prioridad: 'MEDIA',
  estado: 'POR_HACER',
});

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const ProjectsManagement: React.FC = () => {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<Proyecto | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableGestores, setAvailableGestores] = useState<any[]>([]);
  const [selectedGestorId, setSelectedGestorId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Proyecto>({
    nombre: '', descripcion: '', estado: 'INICIO',
    fechaInicio: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ── Task modal state ──
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksProject, setTasksProject] = useState<Proyecto | null>(null);
  const [projectTasks, setProjectTasks] = useState<Tarea[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskUsers, setTaskUsers] = useState<any[]>([]);
  const [newTask, setNewTask] = useState<Omit<Tarea, 'id'>>(emptyTask(0));
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskMessage, setTaskMessage] = useState({ type: '', text: '' });

  // ── Rejection modal state ──
  const [rejectionModal, setRejectionModal] = useState<{
    open: boolean; tarea: Tarea | null; mensaje: string;
  }>({ open: false, tarea: null, mensaje: '' });

  const mockProjects: Proyecto[] = [
    { id: 1, nombre: 'Sistema Innovatech', descripcion: 'Desarrollo de plataforma central', estado: 'EN_PROGRESO', fechaInicio: '2026-05-01' },
    { id: 2, nombre: 'App Móvil Clientes', descripcion: 'Aplicación para seguimiento de proyectos', estado: 'INICIO', fechaInicio: '2026-06-15' },
    { id: 3, nombre: 'Migración Cloud', descripcion: 'Traslado de infraestructura a AWS', estado: 'FINALIZADO', fechaInicio: '2026-01-10' },
  ];

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROJECTS.BASE);
      setProjects(response.ok ? await response.json() : mockProjects);
    } catch {
      setProjects(mockProjects);
    }
  };

  // ─── Project CRUD ───────────────────────────
  const handleShow = (project?: Proyecto) => {
    if (project) {
      setIsEditing(true);
      setCurrentProject(project);
    } else {
      setIsEditing(false);
      setCurrentProject({ nombre: '', descripcion: '', estado: 'INICIO', fechaInicio: new Date().toISOString().split('T')[0] });
    }
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setMessage({ type: '', text: '' }); };

  const handleChange = (e: React.ChangeEvent<any>) => {
    setCurrentProject({ ...currentProject, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = isEditing ? `${API_ENDPOINTS.PROJECTS.BASE}/${currentProject.id}` : API_ENDPOINTS.PROJECTS.BASE;
    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProject),
      });
      if (!response.ok) throw new Error('Error en la operación');
      if (!isEditing) {
        await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: `Proyecto "${currentProject.nombre}" creado con éxito` }),
        }).catch(() => {});
      }
      setMessage({ type: 'success', text: `Proyecto ${isEditing ? 'actualizado' : 'creado'} con éxito` });
      fetchProjects();
      setTimeout(handleClose, 1500);
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message });
      if (isEditing) setProjects(projects.map(p => p.id === currentProject.id ? currentProject : p));
      else setProjects([...projects, { ...currentProject, id: projects.length + 1 }]);
      setTimeout(handleClose, 1500);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => { setProjectToDelete(id); setShowDeleteConfirm(true); };
  const handleDelete = async () => {
    if (projectToDelete === null) return;
    try { await fetch(`${API_ENDPOINTS.PROJECTS.BASE}/${projectToDelete}`, { method: 'DELETE' }); fetchProjects(); }
    catch { setProjects(projects.filter(p => p.id !== projectToDelete)); }
    finally { setShowDeleteConfirm(false); setProjectToDelete(null); }
  };

  // ─── Team modal ─────────────────────────────
  const handleShowTeam = async (project: Proyecto) => {
    setSelectedProjectForTeam(project);
    setShowTeamModal(true);
    setSelectedUserId('');
    setSelectedGestorId(project.gestorId ? String(project.gestorId) : '');
    setAssignedTeam(project.colaboradores ? [...project.colaboradores] : []);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.USERS);
      if (res.ok) {
        const all = await res.json();
        setAvailableUsers(all.filter((u: any) => u.rol === 'COLABORADOR'));
        setAvailableGestores(all.filter((u: any) => u.rol === 'GESTOR_PROYECTOS'));
      } else {
        setAvailableUsers([{ id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' }]);
        setAvailableGestores([{ id: 10, nombre: 'Gestor Demo' }]);
      }
    } catch {
      setAvailableUsers([{ id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' }]);
      setAvailableGestores([{ id: 10, nombre: 'Gestor Demo' }]);
    }
  };

  const handleAddUserToTeamList = () => {
    if (!selectedUserId) return;
    const user = availableUsers.find(u => u.id.toString() === selectedUserId);
    if (user && !assignedTeam.some(u => u.id === user.id)) setAssignedTeam([...assignedTeam, user]);
    setSelectedUserId('');
  };

  const handleRemoveUserFromTeamList = (userId: string) =>
    setAssignedTeam(assignedTeam.filter(u => u.id.toString() !== userId.toString()));

  const handleAssignTeam = async () => {
    if (!selectedProjectForTeam) return;
    if (assignedTeam.length === 0 && !selectedGestorId) {
      setMessage({ type: 'danger', text: 'Debe asignar al menos un gestor o colaborador al equipo' }); return;
    }
    setLoading(true);
    try {
      const gestor = availableGestores.find(g => g.id.toString() === selectedGestorId);
      const payload = {
        gestorId: gestor?.id ?? null,
        gestorNombre: gestor?.nombre ?? null,
        colaboradores: assignedTeam.map(u => ({ id: u.id, nombre: u.nombre })),
      };
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.PROJECTS.BASE}/${selectedProjectForTeam.id}/equipo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('No se pudo guardar el equipo');
      const updated: Proyecto = await response.json();
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: `Equipo actualizado: ${assignedTeam.length} colaboradores para "${selectedProjectForTeam.nombre}"` }),
      }).catch(() => {});
      setMessage({ type: 'success', text: 'Equipo guardado correctamente' });
      setTimeout(() => { setShowTeamModal(false); setMessage({ type: '', text: '' }); }, 1500);
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Error al guardar el equipo' });
    } finally { setLoading(false); }
  };

  // ─── Task modal ─────────────────────────────
  const handleShowTasks = async (project: Proyecto) => {
    setTasksProject(project);
    setShowTaskForm(false);
    setTaskMessage({ type: '', text: '' });

    // Cargar tareas existentes
    const proyectoId = project.id!;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}/tareas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjectTasks(res.ok ? await res.json() : loadLocalTasks(proyectoId));
    } catch {
      setProjectTasks(loadLocalTasks(proyectoId));
    }

    // Cargar usuarios disponibles para asignar
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.USERS);
      if (res.ok) {
        const all = await res.json();
        setTaskUsers(all.filter((u: any) => u.rol === 'COLABORADOR'));
      } else {
        setTaskUsers([
          { id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' },
          { id: 3, nombre: 'Carlos Ruiz' }, { id: 4, nombre: 'Ana García' },
        ]);
      }
    } catch {
      setTaskUsers([
        { id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' },
        { id: 3, nombre: 'Carlos Ruiz' }, { id: 4, nombre: 'Ana García' },
      ]);
    }

    setNewTask(emptyTask(proyectoId));
    setShowTasksModal(true);
  };

  const handleTaskChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    if (name === 'asignadoId') {
      const user = taskUsers.find(u => u.id.toString() === value);
      setNewTask(prev => ({ ...prev, asignadoId: Number(value), asignadoNombre: user?.nombre ?? '' }));
    } else {
      setNewTask(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.asignadoId) {
      setTaskMessage({ type: 'danger', text: 'Debes seleccionar un usuario a cargo.' }); return;
    }
    setTaskLoading(true);
    setTaskMessage({ type: '', text: '' });

    const tarea: Tarea = { ...newTask, id: Date.now(), estado: 'POR_HACER' };
    const proyectoId = tasksProject!.id!;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(tarea),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Guardar localmente como fallback
      const existing = loadLocalTasks(proyectoId);
      saveLocalTasks(proyectoId, [...existing, tarea]);
    }

    await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: `Tarea "${tarea.titulo}" creada en "${tasksProject?.nombre}" y asignada a ${tarea.asignadoNombre}` }),
    }).catch(() => {});

    setProjectTasks(prev => [...prev, tarea]);
    setTaskMessage({ type: 'success', text: `Tarea creada y asignada a ${tarea.asignadoNombre}.` });
    setTimeout(() => {
      setShowTaskForm(false);
      setNewTask(emptyTask(proyectoId));
      setTaskMessage({ type: '', text: '' });
    }, 1200);
    setTaskLoading(false);
  };

  // ─── Task validation ─────────────────────────
  const handleApproveTask = async (tarea: Tarea) => {
    const updated: Tarea = { ...tarea, estado: 'REVISADO', mensajeCorreccion: undefined };
    setProjectTasks(prev => prev.map(t => t.id === tarea.id ? updated : t));
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/proyectos/${tarea.proyectoId}/tareas/${tarea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
    } catch { /* UI optimista: el estado ya se actualizo, se ignora el fallo de red */ }
  };

  const openRejection = (tarea: Tarea) => {
    setRejectionModal({ open: true, tarea, mensaje: '' });
  };

  const handleRejectTask = async () => {
    const { tarea, mensaje } = rejectionModal;
    if (!tarea || !mensaje.trim()) return;
    const updated: Tarea = { ...tarea, estado: 'POR_HACER', mensajeCorreccion: mensaje.trim() };
    setProjectTasks(prev => prev.map(t => t.id === tarea.id ? updated : t));
    setRejectionModal({ open: false, tarea: null, mensaje: '' });
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/proyectos/${tarea.proyectoId}/tareas/${tarea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
    } catch { /* UI optimista: el estado ya se actualizo, se ignora el fallo de red */ }
  };

  const getStatusVariant = (estado: string) => {
    switch (estado) {
      case 'EN_PROGRESO': return 'warning';
      case 'FINALIZADO':  return 'success';
      case 'INICIO':      return 'info';
      default:            return 'secondary';
    }
  };

  return (
    <div className="projects-management">
      <header className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="text-dark fw-bold">Gestión de Proyectos</h1>
          <p className="text-muted">Controla el avance y estado de las iniciativas de Innovatech.</p>
        </div>
        <Button className="create-project-btn d-flex align-items-center gap-2" onClick={() => handleShow()}>
          <Plus size={18} /> Nuevo Proyecto
        </Button>
      </header>

      <Card className="projects-card border-0 shadow-lg">
        <Table responsive hover className="projects-table mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Proyecto</th>
              <th>Estado</th>
              <th>Fecha Inicio</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="text-muted">#{project.id}</td>
                <td>
                  <div className="fw-500 text-dark">{project.nombre}</div>
                  <div className="text-muted small">{project.descripcion}</div>
                </td>
                <td>
                  <Badge bg={getStatusVariant(project.estado)} className="status-badge">
                    {project.estado}
                  </Badge>
                </td>
                <td className="text-muted">{project.fechaInicio}</td>
                <td className="text-end">
                  <Button variant="link" className="action-btn tasks-btn" onClick={() => handleShowTasks(project)} title="Gestionar Tareas">
                    <ClipboardList size={18} />
                  </Button>
                  <Button variant="link" className="action-btn team-btn" onClick={() => handleShowTeam(project)} title="Gestionar Equipo">
                    <Users size={18} />
                  </Button>
                  <Button variant="link" className="action-btn edit-btn" onClick={() => handleShow(project)} title="Editar">
                    <Pencil size={18} />
                  </Button>
                  <Button variant="link" className="action-btn delete-btn" onClick={() => confirmDelete(project.id!)} title="Eliminar">
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* ── Modal Proyecto ── */}
      <Modal show={showModal} onHide={handleClose} centered className="project-modal">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {message.text && <Alert variant={message.type}>{message.text}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Proyecto</Form.Label>
              <Form.Control type="text" name="nombre" value={currentProject.nombre} onChange={handleChange} required className="modal-input" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control as="textarea" rows={3} name="descripcion" value={currentProject.descripcion} onChange={handleChange} required className="modal-input" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Inicio</Form.Label>
              <Form.Control type="date" name="fechaInicio" value={currentProject.fechaInicio} onChange={handleChange} required className="modal-input" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select name="estado" value={currentProject.estado} onChange={handleChange} className="modal-input">
                <option value="INICIO">Inicio</option>
                <option value="EN_PROGRESO">En Progreso</option>
                <option value="FINALIZADO">Finalizado</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={loading} className="modal-btn">
              {loading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Proyecto')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal Eliminar ── */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar Eliminación</Modal.Title></Modal.Header>
        <Modal.Body><p>¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.</p></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal Equipo ── */}
      <Modal show={showTeamModal} onHide={() => setShowTeamModal(false)} centered className="project-modal">
        <Modal.Header closeButton>
          <Modal.Title>Equipo: {selectedProjectForTeam?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message.text && <Alert variant={message.type}>{message.text}</Alert>}

          {/* ── Gestor del proyecto ── */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Gestor del Proyecto</Form.Label>
            <Form.Select
              value={selectedGestorId}
              onChange={e => setSelectedGestorId(e.target.value)}
              className="modal-input"
            >
              <option value="">Sin gestor asignado</option>
              {availableGestores.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </Form.Select>
            <Form.Text className="text-muted">El gestor podrá ver y validar todas las tareas del proyecto.</Form.Text>
          </Form.Group>

          <hr className="my-3" />

          {/* ── Colaboradores ── */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Agregar Colaborador</Form.Label>
            <div className="d-flex gap-2">
              <Form.Select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="modal-input">
                <option value="">Seleccione un usuario...</option>
                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </Form.Select>
              <Button variant="primary" onClick={handleAddUserToTeamList} disabled={!selectedUserId} className="d-flex align-items-center justify-content-center" style={{ borderRadius: '12px' }}>
                <Plus size={20} />
              </Button>
            </div>
          </Form.Group>
          <div className="team-list mt-4">
            <Form.Label>Colaboradores Asignados ({assignedTeam.length})</Form.Label>
            {assignedTeam.length === 0 ? (
              <div className="text-muted small p-3 bg-light rounded text-center">No hay colaboradores agregados aún.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {assignedTeam.map(user => (
                  <div key={user.id} className="d-flex justify-content-between align-items-center p-2 border rounded bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontWeight: 'bold' }}>
                        {user.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="fw-500">{user.nombre}</span>
                    </div>
                    <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveUserFromTeamList(user.id)} title="Remover">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTeamModal(false)}>Cerrar</Button>
          <Button variant="primary" onClick={handleAssignTeam} disabled={loading || (assignedTeam.length === 0 && !selectedGestorId)} className="modal-btn">
            {loading ? 'Guardando...' : 'Guardar Equipo'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal Tareas ── */}
      <Modal show={showTasksModal} onHide={() => { setShowTasksModal(false); setShowTaskForm(false); }} centered size="lg" className="project-modal">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            {showTaskForm && (
              <Button variant="link" className="p-0 me-1 text-secondary" onClick={() => { setShowTaskForm(false); setTaskMessage({ type: '', text: '' }); }}>
                <ChevronLeft size={22} />
              </Button>
            )}
            <ClipboardList size={20} />
            {showTaskForm ? 'Nueva Tarea' : `Tareas: ${tasksProject?.nombre}`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {taskMessage.text && <Alert variant={taskMessage.type} className="mb-3">{taskMessage.text}</Alert>}

          {/* ── Vista: lista de tareas ── */}
          {!showTaskForm && (
            <>
              {projectTasks.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <ClipboardList size={36} className="mb-2 opacity-25" />
                  <p className="mb-0">Este proyecto no tiene tareas aún.</p>
                </div>
              ) : (
                <div className="task-admin-list">
                  {projectTasks.map(t => {
                    const p = PRIORIDAD_CONFIG[t.prioridad];
                    const estadoLabel: Record<string, string> = {
                      POR_HACER: 'Por Hacer', EN_PROGRESO: 'En Progreso',
                      COMPLETADO: 'Completado', REVISADO: 'Revisado',
                    };
                    const estadoBg: Record<string, string> = {
                      POR_HACER: 'secondary', EN_PROGRESO: 'warning',
                      COMPLETADO: 'success', REVISADO: 'info',
                    };
                    return (
                      <div key={t.id} className="task-admin-item">
                        <div className="task-admin-left" style={{ flex: 1 }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="task-admin-title">{t.titulo}</span>
                            <Badge style={{ backgroundColor: p.bg, color: p.color, fontSize: '0.7rem', fontWeight: 700 }}>
                              {t.prioridad}
                            </Badge>
                          </div>
                          {t.mensajeCorreccion && t.estado === 'POR_HACER' && (
                            <div className="task-correction-msg">
                              <AlertTriangle size={12} />
                              <span>Corrección: {t.mensajeCorreccion}</span>
                            </div>
                          )}
                          <p className="task-admin-desc">{t.descripcion}</p>
                          <div className="task-admin-meta">
                            <span>👤 {t.asignadoNombre || '—'}</span>
                            <span>📅 Límite: {t.fechaLimite || '—'}</span>
                          </div>
                          {t.estado === 'COMPLETADO' && (
                            <div className="task-validation-btns">
                              <button className="task-btn-approve" onClick={() => handleApproveTask(t)}>
                                <CheckCircle size={13} /> Aprobar
                              </button>
                              <button className="task-btn-reject" onClick={() => openRejection(t)}>
                                <XCircle size={13} /> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                        <Badge bg={estadoBg[t.estado] ?? 'secondary'} className="task-admin-estado">
                          {estadoLabel[t.estado] ?? t.estado}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Vista: formulario nueva tarea ── */}
          {showTaskForm && (
            <Form id="task-form" onSubmit={handleCreateTask}>
              <div className="row g-3">
                <div className="col-12">
                  <Form.Group>
                    <Form.Label>Nombre de la tarea <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text" name="titulo" value={newTask.titulo}
                      onChange={handleTaskChange} required className="modal-input"
                      placeholder="Ej: Diseñar interfaz principal"
                    />
                  </Form.Group>
                </div>
                <div className="col-12">
                  <Form.Group>
                    <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea" rows={3} name="descripcion" value={newTask.descripcion}
                      onChange={handleTaskChange} required className="modal-input"
                      placeholder="Describe qué se debe realizar..."
                    />
                  </Form.Group>
                </div>
                <div className="col-sm-6">
                  <Form.Group>
                    <Form.Label>Fecha de creación</Form.Label>
                    <Form.Control
                      type="date" name="fechaCreacion" value={newTask.fechaCreacion}
                      onChange={handleTaskChange} className="modal-input" readOnly
                    />
                  </Form.Group>
                </div>
                <div className="col-sm-6">
                  <Form.Group>
                    <Form.Label>Fecha límite <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date" name="fechaLimite" value={newTask.fechaLimite}
                      onChange={handleTaskChange} required className="modal-input"
                      min={newTask.fechaCreacion}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm-6">
                  <Form.Group>
                    <Form.Label>Prioridad</Form.Label>
                    <Form.Select name="prioridad" value={newTask.prioridad} onChange={handleTaskChange} className="modal-input">
                      {PRIORIDAD_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-sm-6">
                  <Form.Group>
                    <Form.Label>Usuario a cargo <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="asignadoId" value={newTask.asignadoId || ''}
                      onChange={handleTaskChange} required className="modal-input"
                    >
                      <option value="">Seleccionar usuario...</option>
                      {taskUsers.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowTasksModal(false); setShowTaskForm(false); }}>Cerrar</Button>
          {!showTaskForm ? (
            <Button variant="primary" className="modal-btn d-flex align-items-center gap-2" onClick={() => { setShowTaskForm(true); setTaskMessage({ type: '', text: '' }); }}>
              <Plus size={16} /> Nueva Tarea
            </Button>
          ) : (
            <Button variant="primary" type="submit" form="task-form" disabled={taskLoading} className="modal-btn">
              {taskLoading ? 'Creando...' : 'Crear Tarea'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      {/* ── Modal Rechazo de Tarea ── */}
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
              as="textarea" rows={4}
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
          <Button variant="danger" disabled={!rejectionModal.mensaje.trim()} onClick={handleRejectTask}>
            <XCircle size={16} className="me-1" />
            Rechazar y Solicitar Correcciones
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProjectsManagement;
