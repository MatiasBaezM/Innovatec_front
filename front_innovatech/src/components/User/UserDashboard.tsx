import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { FolderKanban, CheckCircle, Clock, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import './UserDashboard.css';

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

interface Actividad {
  id: number;
  titulo: string;
  fechaCreacion: string;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INICIO:       { label: 'Inicio',       color: '#92400e', bg: '#fef3c7' },
  EN_PROGRESO:  { label: 'En Progreso',  color: '#3730a3', bg: '#ede9fe' },
  FINALIZADO:   { label: 'Finalizado',   color: '#065f46', bg: '#d1fae5' },
};

const MOCK_PROYECTOS: Proyecto[] = [
  { id: 1, nombre: 'Plataforma Digital', descripcion: 'Desarrollo de la nueva plataforma web corporativa.', estado: 'EN_PROGRESO' },
  { id: 2, nombre: 'App Móvil Clientes', descripcion: 'Aplicación para gestión de clientes en dispositivos móviles.', estado: 'INICIO' },
  { id: 3, nombre: 'Integración ERP',    descripcion: 'Integración del sistema ERP con el portal interno.', estado: 'FINALIZADO' },
];

const UserDashboard: React.FC = () => {
  const { userInfo } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(API_ENDPOINTS.PROJECTS.BASE, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => MOCK_PROYECTOS),
      fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => []),
    ]).then(([pData, aData]) => {
      setProyectos(pData.slice(0, 6));
      setActividades(aData.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const activos     = proyectos.filter(p => p.estado === 'EN_PROGRESO').length;
  const finalizados = proyectos.filter(p => p.estado === 'FINALIZADO').length;

  const stats = [
    { label: 'Proyectos Asignados', value: proyectos.length, icon: <FolderKanban size={22} />, color: '#6366f1' },
    { label: 'En Progreso',         value: activos,           icon: <Clock size={22} />,         color: '#f59e0b' },
    { label: 'Finalizados',         value: finalizados,       icon: <CheckCircle size={22} />,   color: '#10b981' },
  ];

  const navigate = useNavigate();
  const firstName = userInfo?.nombre?.split(' ')[0] || 'Usuario';

  return (
    <div className="user-dashboard">
      <header className="ud-header">
        <div>
          <h1 className="ud-title">Hola, {firstName}</h1>
          <p className="ud-subtitle">Aquí tienes un resumen de tu actividad.</p>
        </div>
      </header>

      {/* Stats */}
      <Row className="g-4 mb-5">
        {stats.map((s, i) => (
          <Col key={i} xs={12} sm={4}>
            <Card className="ud-stat-card border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="ud-stat-icon" style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div className="ud-stat-label">{s.label}</div>
                  <div className="ud-stat-value">{loading ? '—' : s.value}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        {/* Proyectos recientes */}
        <Col lg={8}>
          <Card className="ud-card border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                  <FolderKanban size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Mis Proyectos</h5>
                </div>
                <Link to="/user/proyectos" className="ud-ver-todos">Ver todos</Link>
              </div>

              {loading ? (
                <div className="ud-empty">Cargando proyectos...</div>
              ) : proyectos.length === 0 ? (
                <div className="ud-empty">No tienes proyectos asignados aún.</div>
              ) : (
                <div className="ud-project-list">
                  {proyectos.slice(0, 4).map(p => {
                    const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.INICIO;
                    return (
                      <div key={p.id} className="ud-project-item" onClick={() => navigate(`/user/proyectos/${p.id}`)} style={{ cursor: 'pointer' }}>
                        <div className="ud-project-dot" style={{ background: cfg.color }} />
                        <div className="ud-project-info">
                          <p className="ud-project-name">{p.nombre}</p>
                          <p className="ud-project-desc">{p.descripcion}</p>
                        </div>
                        <Badge
                          className="ud-estado-badge"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Actividad reciente */}
        <Col lg={4}>
          <Card className="ud-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Activity size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Actividad Reciente</h5>
              </div>

              {actividades.length === 0 ? (
                <div className="ud-empty">Sin actividad reciente.</div>
              ) : (
                <div className="ud-activity-list">
                  {actividades.map(a => (
                    <div key={a.id} className="ud-activity-item">
                      <div className="ud-activity-dot" />
                      <div>
                        <p className="ud-activity-title">{a.titulo}</p>
                        <small className="ud-activity-date">
                          {new Date(a.fechaCreacion).toLocaleDateString('es-CL', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserDashboard;
