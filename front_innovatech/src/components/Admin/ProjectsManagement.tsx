import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card } from 'react-bootstrap';
import { Pencil, Trash2, Plus, Users } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import './ProjectsManagement.css';

interface Proyecto {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaInicio: string;
}

const ProjectsManagement: React.FC = () => {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<Proyecto | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Proyecto>({
    nombre: '',
    descripcion: '',
    estado: 'INICIO',
    fechaInicio: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Simulación de datos para visualización inmediata si el backend no responde
  const mockProjects: Proyecto[] = [
    { id: 1, nombre: 'Sistema Innovatech', descripcion: 'Desarrollo de plataforma central', estado: 'EN_PROGRESO', fechaInicio: '2026-05-01' },
    { id: 2, nombre: 'App Móvil Clientes', descripcion: 'Aplicación para seguimiento de proyectos', estado: 'INICIO', fechaInicio: '2026-06-15' },
    { id: 3, nombre: 'Migración Cloud', descripcion: 'Traslado de infraestructura a AWS', estado: 'FINALIZADO', fechaInicio: '2026-01-10' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROJECTS.BASE);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setProjects(mockProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects(mockProjects);
    }
  };

  const handleShow = (project?: Proyecto) => {
    if (project) {
      setIsEditing(true);
      setCurrentProject(project);
    } else {
      setIsEditing(false);
      setCurrentProject({
        nombre: '',
        descripcion: '',
        estado: 'INICIO',
        fechaInicio: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setMessage({ type: '', text: '' });
  };

  const handleShowTeam = async (project: Proyecto) => {
    setSelectedProjectForTeam(project);
    setShowTeamModal(true);
    setSelectedUserId('');
    setAssignedTeam([]);
    setMessage({ type: '', text: '' });
    
    // Fetch all available workers
    try {
      const res = await fetch(API_ENDPOINTS.RESOURCES.WORKERS);
      if (res.ok) {
        const users = await res.json();
        setAvailableUsers(users);
      } else {
        setAvailableUsers([{ id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' }]);
      }
    } catch {
      setAvailableUsers([{ id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' }]);
    }

    // Fetch existing assigned team for this project
    try {
      const resEquipo = await fetch(`${API_ENDPOINTS.RESOURCES.TEAMS}/proyecto/${project.id}`);
      if (resEquipo.ok) {
        const text = await resEquipo.text();
        if (text) {
          const equipoData = JSON.parse(text);
          if (equipoData && equipoData.trabajadores && equipoData.trabajadores.length > 0) {
            setAssignedTeam(equipoData.trabajadores);
          }
        }
      }
    } catch (e) {
      console.log('No hay equipo asignado previamente o hubo un error');
    }
  };

  const handleAddUserToTeamList = () => {
    if (!selectedUserId) return;
    const user = availableUsers.find(u => u.id.toString() === selectedUserId);
    if (user && !assignedTeam.some(u => u.id === user.id)) {
      setAssignedTeam([...assignedTeam, user]);
    }
    setSelectedUserId('');
  };

  const handleRemoveUserFromTeamList = (userId: string) => {
    setAssignedTeam(assignedTeam.filter(u => u.id.toString() !== userId.toString()));
  };

  const handleAssignTeam = async () => {
    if (!selectedProjectForTeam || assignedTeam.length === 0) {
      setMessage({ type: 'danger', text: 'Debe agregar al menos un colaborador al equipo' });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        nombre: `Equipo de ${selectedProjectForTeam.nombre}`,
        descripcion: `Equipo asignado para el proyecto: ${selectedProjectForTeam.nombre}`,
        proyectoId: selectedProjectForTeam.id,
        trabajadores: assignedTeam.map(user => ({ id: user.id }))
      };

      const response = await fetch(API_ENDPOINTS.RESOURCES.TEAMS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar el equipo en la base de datos');
      }

      // Log the activity to Dashboard
      await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: `Equipo conformado: ${assignedTeam.length} colaboradores para "${selectedProjectForTeam.nombre}"` })
      }).catch(err => console.log('Error logging activity', err));

      setMessage({ type: 'success', text: 'Equipo guardado correctamente en la base de datos' });
      setTimeout(() => {
        setShowTeamModal(false);
        setMessage({ type: '', text: '' });
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Error al guardar el equipo' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    setCurrentProject({ ...currentProject, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = isEditing 
      ? `${API_ENDPOINTS.PROJECTS.BASE}/${currentProject.id}` 
      : API_ENDPOINTS.PROJECTS.BASE;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      // Nota: Esto fallará si el backend no está implementado aún
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProject),
      });

      if (!response.ok) throw new Error('Error en la operación (Backend no implementado)');

      if (!isEditing) {
        await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: `Proyecto "${currentProject.nombre}" creado con éxito` })
        }).catch(err => console.log('Error logging activity', err));
      }

      setMessage({ type: 'success', text: `Proyecto ${isEditing ? 'actualizado' : 'creado'} con éxito` });
      fetchProjects();
      setTimeout(handleClose, 1500);
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message });
      // Para fines de demo, simulamos éxito en el estado local
      if (isEditing) {
        setProjects(projects.map(p => p.id === currentProject.id ? currentProject : p));
      } else {
        setProjects([...projects, { ...currentProject, id: projects.length + 1 }]);
      }
      setTimeout(handleClose, 1500);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setProjectToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (projectToDelete === null) return;
    try {
      await fetch(`${API_ENDPOINTS.PROJECTS.BASE}/${projectToDelete}`, { method: 'DELETE' });
      fetchProjects();
    } catch (error) {
      setProjects(projects.filter(p => p.id !== projectToDelete));
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  const getStatusVariant = (estado: string) => {
    switch (estado) {
      case 'EN_PROGRESO': return 'warning';
      case 'FINALIZADO': return 'success';
      case 'INICIO': return 'info';
      default: return 'secondary';
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

      <Modal show={showModal} onHide={handleClose} centered className="project-modal">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {message.text && <Alert variant={message.type}>{message.text}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Proyecto</Form.Label>
              <Form.Control 
                type="text" 
                name="nombre" 
                value={currentProject.nombre} 
                onChange={handleChange} 
                required 
                className="modal-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="descripcion" 
                value={currentProject.descripcion} 
                onChange={handleChange} 
                required 
                className="modal-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Inicio</Form.Label>
              <Form.Control 
                type="date" 
                name="fechaInicio" 
                value={currentProject.fechaInicio} 
                onChange={handleChange} 
                required 
                className="modal-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select 
                name="estado" 
                value={currentProject.estado} 
                onChange={handleChange} 
                className="modal-input"
              >
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

      {/* Modal de Confirmación de Eliminación */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Equipo */}
      <Modal show={showTeamModal} onHide={() => setShowTeamModal(false)} centered className="project-modal">
        <Modal.Header closeButton>
          <Modal.Title>Equipo: {selectedProjectForTeam?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message.text && <Alert variant={message.type}>{message.text}</Alert>}
          <Form.Group className="mb-4">
            <Form.Label>Seleccionar Colaborador</Form.Label>
            <div className="d-flex gap-2">
              <Form.Select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="modal-input"
              >
                <option value="">Seleccione un usuario...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </Form.Select>
              <Button variant="primary" onClick={handleAddUserToTeamList} disabled={!selectedUserId} className="d-flex align-items-center justify-content-center" style={{borderRadius: '12px'}}>
                <Plus size={20} />
              </Button>
            </div>
          </Form.Group>

          <div className="team-list mt-4">
            <Form.Label>Colaboradores Asignados ({assignedTeam.length})</Form.Label>
            {assignedTeam.length === 0 ? (
              <div className="text-muted small p-3 bg-light rounded text-center">No hay colaboradores agregados aún.</div>
            ) : (
              <div className="d-flex flex-column gap-2 max-h-40 overflow-auto">
                {assignedTeam.map(user => (
                  <div key={user.id} className="d-flex justify-content-between align-items-center p-2 border rounded bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px', fontWeight: 'bold'}}>
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
          <Button variant="primary" onClick={handleAssignTeam} disabled={loading || assignedTeam.length === 0} className="modal-btn">
            {loading ? 'Guardando...' : 'Guardar Equipo'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProjectsManagement;
