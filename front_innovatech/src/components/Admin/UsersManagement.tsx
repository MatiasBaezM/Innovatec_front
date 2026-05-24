import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card, InputGroup } from 'react-bootstrap';
import { Pencil, Trash2, Search, Plus } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { formatRut, validateRut } from '../../utils/rutUtils';
import './UsersManagement.css';

interface Usuario {
  id?: number;
  rut: string;
  nombre: string;
  clave?: string;
  rol: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario>({
    rut: '',
    nombre: '',
    clave: '',
    rol: 'COLABORADOR'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.USERS);
      const data = await response.json();
      // Ordenamos alfabéticamente por nombre por defecto
      const sortedData = data.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      setUsers(sortedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback a datos de prueba si falla la API
      setUsers([
        { id: 1, nombre: 'Admin Innovatech', rut: '11.111.111-1', rol: 'ADMINISTRADOR' },
      ]);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShow = (user?: Usuario) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser({ ...user, clave: '' }); // No mostramos la clave
    } else {
      setIsEditing(false);
      setCurrentUser({ rut: '', nombre: '', clave: '', rol: 'COLABORADOR' });
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setMessage({ type: '', text: '' });
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setCurrentUser({ ...currentUser, [name]: name === 'rut' ? formatRut(value) : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRut(currentUser.rut)) {
      setMessage({ type: 'danger', text: 'El RUT ingresado no es válido. Verifica que el formato sea correcto (ej. 12.345.678-9).' });
      return;
    }

    setLoading(true);
    const url = isEditing
      ? `${API_ENDPOINTS.AUTH.USERS}/${currentUser.id}`
      : API_ENDPOINTS.AUTH.REGISTER;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentUser),
      });

      if (!response.ok) throw new Error('Error en la operación');

      setMessage({ type: 'success', text: `Usuario ${isEditing ? 'actualizado' : 'creado'} con éxito` });
      fetchUsers();
      setTimeout(handleClose, 1500);
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (userToDelete === null) return;
    try {
      await fetch(`${API_ENDPOINTS.AUTH.USERS}/${userToDelete}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const getBadgeVariant = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR': return 'danger';
      case 'GESTOR_PROYECTOS': return 'warning';
      case 'ANALISTA': return 'info';
      default: return 'primary';
    }
  };

  return (
    <div className="users-management">
      <header className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="text-dark fw-bold">Gestión de Usuarios</h1>
          <p className="text-muted">Administra las cuentas y roles del sistema.</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <Search size={18} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre o RUT..."
              className="search-input border-start-0 ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Button className="create-btn d-flex align-items-center gap-2" onClick={() => handleShow()}>
            <Plus size={18} /> Nuevo Usuario
          </Button>
        </div>
      </header>

      <Card className="users-card border-0 shadow-lg">
        <Table responsive hover className="users-table mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Rol</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="text-muted">#{user.id}</td>
                <td className="fw-500 text-dark">{user.nombre}</td>
                <td className="text-muted">{user.rut}</td>
                <td>
                  <Badge bg={getBadgeVariant(user.rol)} className="role-badge">
                    {user.rol}
                  </Badge>
                </td>
                <td className="text-end">
                  <Button variant="link" className="action-btn edit-btn" onClick={() => handleShow(user)} title="Editar">
                    <Pencil size={18} />
                  </Button>
                  <Button variant="link" className="action-btn delete-btn" onClick={() => confirmDelete(user.id!)} title="Eliminar">
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleClose} centered className="user-modal">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {message.text && <Alert variant={message.type}>{message.text}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>RUT</Form.Label>
              <Form.Control
                type="text"
                name="rut"
                value={currentUser.rut}
                onChange={handleChange}
                required
                className="modal-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={currentUser.nombre}
                onChange={handleChange}
                required
                className="modal-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</Form.Label>
              <Form.Control
                type="password"
                name="clave"
                value={currentUser.clave}
                onChange={handleChange}
                required={!isEditing}
                className="modal-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="rol"
                value={currentUser.rol}
                onChange={handleChange}
                className="modal-input"
              >
                <option value="COLABORADOR">Colaborador</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="GESTOR_PROYECTOS">Gestor de Proyectos</option>
                <option value="ANALISTA">Analista</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={loading} className="modal-btn">
              {loading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
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
          <p>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</p>
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
    </div>
  );
};

export default UsersManagement;
