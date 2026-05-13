import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card } from 'react-bootstrap';
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

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      try {
        await fetch(`${API_ENDPOINTS.PROJECTS.BASE}/${id}`, { method: 'DELETE' });
        fetchProjects();
      } catch (error) {
        setProjects(projects.filter(p => p.id !== id));
      }
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
          <h1 className="text-white fw-bold">Gestión de Proyectos</h1>
          <p className="text-white">Controla el avance y estado de las iniciativas de Innovatech.</p>
        </div>
        <Button className="create-project-btn" onClick={() => handleShow()}>
          + Nuevo Proyecto
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
                  <div className="fw-500 text-white">{project.nombre}</div>
                  <div className="text-muted small">{project.descripcion}</div>
                </td>
                <td>
                  <Badge bg={getStatusVariant(project.estado)} className="status-badge">
                    {project.estado}
                  </Badge>
                </td>
                <td className="text-muted">{project.fechaInicio}</td>
                <td className="text-end">
                  <Button variant="link" className="action-btn edit-btn" onClick={() => handleShow(project)}>
                    ✏️
                  </Button>
                  <Button variant="link" className="action-btn delete-btn" onClick={() => handleDelete(project.id!)}>
                    🗑️
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleClose} centered className="project-modal">
        <Modal.Header closeButton closeVariant="white">
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
    </div>
  );
};

export default ProjectsManagement;
