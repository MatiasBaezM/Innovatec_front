import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Form, InputGroup } from 'react-bootstrap';
import { FolderKanban, Search, Users, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import './UserProjects.css';

interface Colaborador {
  id: number;
  nombre: string;
  rol?: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  colaboradores?: Colaborador[];
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INICIO:      { label: 'Inicio',      color: '#92400e', bg: '#fef3c7' },
  EN_PROGRESO: { label: 'En Progreso', color: '#3730a3', bg: '#ede9fe' },
  FINALIZADO:  { label: 'Finalizado',  color: '#065f46', bg: '#d1fae5' },
};

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'INICIO', label: 'Inicio' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
];

const MOCK: Proyecto[] = [
  { id: 1, nombre: 'Plataforma Digital',  descripcion: 'Desarrollo de la nueva plataforma web corporativa.',         estado: 'EN_PROGRESO' },
  { id: 2, nombre: 'App Móvil Clientes',  descripcion: 'Aplicación para gestión de clientes en dispositivos móviles.', estado: 'INICIO' },
  { id: 3, nombre: 'Integración ERP',     descripcion: 'Integración del sistema ERP con el portal interno.',           estado: 'FINALIZADO' },
  { id: 4, nombre: 'Portal de Empleados', descripcion: 'Portal centralizado para la gestión del personal.',             estado: 'EN_PROGRESO' },
  { id: 5, nombre: 'Migración de Datos',  descripcion: 'Migración del historial de datos al nuevo sistema.',            estado: 'INICIO' },
];

function getInitials(nombre: string) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

interface MembersModalProps {
  proyecto: Proyecto;
  colaboradores: Colaborador[];
  onClose: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({ proyecto, colaboradores, onClose }) => {
  const cfg = ESTADO_CONFIG[proyecto.estado] || ESTADO_CONFIG.INICIO;

  return (
    <div className="up-modal-overlay" onClick={onClose}>
      <div className="up-modal" onClick={e => e.stopPropagation()}>
        <div className="up-modal-header">
          <div>
            <h5 className="up-modal-title">{proyecto.nombre}</h5>
            <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="up-estado-badge">
              {cfg.label}
            </Badge>
          </div>
          <button className="up-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="up-modal-subtitle">
          <Users size={15} />
          <span>{colaboradores.length} {colaboradores.length === 1 ? 'integrante' : 'integrantes'}</span>
        </div>

        <div className="up-modal-members">
          {colaboradores.length === 0 ? (
            <p className="up-modal-empty">Este proyecto no tiene integrantes asignados.</p>
          ) : (
            colaboradores.map(c => (
              <div key={c.id} className="up-member-row">
                <div className="up-member-avatar">{getInitials(c.nombre)}</div>
                <div className="up-member-info">
                  <span className="up-member-name">{c.nombre}</span>
                  {c.rol && <span className="up-member-rol">{c.rol}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const UserProjects: React.FC = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalProyecto, setModalProyecto] = useState<Proyecto | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    fetch(API_ENDPOINTS.PROJECTS.BASE, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setProyectos)
      .catch(() => setProyectos(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const proyectosFiltrados = proyectos.filter(p => {
    const matchBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const getEquipo = (proyectoId: number): Colaborador[] =>
    proyectos.find(p => p.id === proyectoId)?.colaboradores ?? [];

  const abrirModal = (e: React.MouseEvent, proyecto: Proyecto) => {
    e.stopPropagation();
    setModalProyecto(proyecto);
  };

  return (
    <div className="user-projects">
      <header className="up-header">
        <div className="d-flex align-items-center gap-2">
          <FolderKanban size={26} className="text-primary" />
          <div>
            <h1 className="up-title">Mis Proyectos</h1>
            <p className="up-subtitle">Proyectos en los que participas.</p>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="up-filters">
        <InputGroup className="up-search">
          <InputGroup.Text className="up-search-icon">
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Buscar proyectos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="up-search-input"
          />
        </InputGroup>

        <div className="up-estado-filters">
          {FILTROS.map(f => (
            <button
              key={f.value}
              className={`up-filtro-btn ${filtroEstado === f.value ? 'active' : ''}`}
              onClick={() => setFiltroEstado(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de proyectos */}
      {loading ? (
        <div className="up-empty">Cargando proyectos...</div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="up-empty">No se encontraron proyectos.</div>
      ) : (
        <Row className="g-4">
          {proyectosFiltrados.map(p => {
            const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.INICIO;
            const colaboradores = getEquipo(p.id);
            return (
              <Col key={p.id} xs={12} sm={6} xl={4}>
                <Card
                  className="up-project-card border-0 shadow-sm"
                  onClick={() => navigate(`/user/proyectos/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="up-card-icon">
                        <FolderKanban size={20} />
                      </div>
                      <Badge
                        className="up-estado-badge"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </Badge>
                    </div>

                    <h5 className="up-card-title">{p.nombre}</h5>
                    <p className="up-card-desc">{p.descripcion}</p>

                    <div className="up-card-footer">
                      <button
                        className="up-miembros-btn"
                        onClick={e => abrirModal(e, p)}
                      >
                        <Users size={14} />
                        {colaboradores.length} {colaboradores.length === 1 ? 'miembro' : 'miembros'}
                      </button>
                      <span className="up-ver-tablero">
                        Ver tablero <ArrowRight size={13} />
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modal de integrantes */}
      {modalProyecto && (
        <MembersModal
          proyecto={modalProyecto}
          colaboradores={getEquipo(modalProyecto.id)}
          onClose={() => setModalProyecto(null)}
        />
      )}
    </div>
  );
};

export default UserProjects;
