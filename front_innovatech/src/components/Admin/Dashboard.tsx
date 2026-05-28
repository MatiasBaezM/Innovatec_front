import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Rocket, Users, ClipboardList, DollarSign, Activity, BarChart2, Zap, TrendingUp } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import './Dashboard.css';

interface Resumen {
  totalProyectos: number;
  proyectosActivos: number;
  totalTrabajadores: number;
  tareasPendientes: number;
  tareasCompletadas: number;
  presupuestoTotal: number;
}

interface GrupoConteo {
  label: string;
  cantidad: number;
}

interface CargaTrabajo {
  nombre: string;
  totalHoras: number;
}

const ESTADO_LABELS: Record<string, string> = {
  INICIO: 'Inicio',
  EN_PROGRESO: 'En Progreso',
  FINALIZADO: 'Finalizado',
  POR_HACER: 'Por Hacer',
  COMPLETADO: 'Completado',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

const PROYECTO_COLORS: Record<string, string> = {
  INICIO: '#f59e0b',
  EN_PROGRESO: '#6366f1',
  FINALIZADO: '#10b981',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  ALTA: '#ef4444',
  MEDIA: '#f59e0b',
  BAJA: '#10b981',
};

const TAREA_ESTADO_COLORS: Record<string, string> = {
  POR_HACER: '#64748b',
  EN_PROGRESO: '#6366f1',
  COMPLETADO: '#10b981',
};

function getInitials(nombre: string) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const Dashboard: React.FC = () => {
  const [resumen, setResumen] = React.useState<Resumen | null>(null);
  const [proyectosEstado, setProyectosEstado] = React.useState<GrupoConteo[]>([]);
  const [tareasPrioridad, setTareasPrioridad] = React.useState<GrupoConteo[]>([]);
  const [tareasEstado, setTareasEstado] = React.useState<GrupoConteo[]>([]);
  const [cargaTrabajo, setCargaTrabajo] = React.useState<CargaTrabajo[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const BASE = API_ENDPOINTS.ANALYTICS.BASE;
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.allSettled([
      fetch(`${BASE}/resumen`,         { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${BASE}/proyectos`,        { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/tareas/prioridad`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/tareas/estado`,    { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/carga-trabajo`,    { headers }).then(r => r.ok ? r.json() : []),
      fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES).then(r => r.ok ? r.json() : []),
    ]).then(results => {
      const vals = results.map(r => r.status === 'fulfilled' ? r.value : null);
      if (vals[0]) setResumen(vals[0]);
      if (vals[1]) setProyectosEstado(vals[1]);
      if (vals[2]) setTareasPrioridad(vals[2]);
      if (vals[3]) setTareasEstado(vals[3]);
      if (vals[4]) setCargaTrabajo(vals[4]);
      if (vals[5]) setRecentActivities(vals[5]);
    });
  }, []);

  const kpis = [
    {
      label: 'Proyectos Activos',
      value: resumen?.proyectosActivos ?? '—',
      sub: resumen ? `de ${resumen.totalProyectos} totales` : '',
      icon: <Rocket size={22} />,
      color: '#6366f1',
    },
    {
      label: 'Colaboradores',
      value: resumen?.totalTrabajadores ?? '—',
      sub: 'en el sistema',
      icon: <Users size={22} />,
      color: '#8b5cf6',
    },
    {
      label: 'Tareas Pendientes',
      value: resumen?.tareasPendientes ?? '—',
      sub: resumen ? `${resumen.tareasCompletadas} completadas` : '',
      icon: <ClipboardList size={22} />,
      color: '#f59e0b',
    },
    {
      label: 'Presupuesto Total',
      value: resumen
        ? `$${resumen.presupuestoTotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`
        : '—',
      sub: 'horas × tarifa',
      icon: <DollarSign size={22} />,
      color: '#10b981',
    },
  ];

  const maxProyecto       = Math.max(...proyectosEstado.map(p => p.cantidad), 1);
  const maxTarea          = Math.max(...tareasPrioridad.map(t => t.cantidad), 1);
  const maxCarga          = Math.max(...cargaTrabajo.map(c => c.totalHoras), 1);
  const totalTareasEstado = tareasEstado.reduce((s, t) => s + t.cantidad, 0) || 1;

  return (
    <div className="dashboard">
      <header className="dashboard-header mb-5">
        <h1 className="dashboard-title">Panel de Control</h1>
        <p className="dashboard-subtitle text-muted">Bienvenido de nuevo, administrador.</p>
      </header>

      {/* ── KPIs ── */}
      <Row className="g-4 mb-4">
        {kpis.map((stat, idx) => (
          <Col key={idx} xs={12} sm={6} lg={3}>
            <Card className="stat-card border-0">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div>
                  <div className="stat-label text-muted small">{stat.label}</div>
                  <div className="stat-value fw-bold">{stat.value}</div>
                  {stat.sub && <div className="stat-sub">{stat.sub}</div>}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Gráficos fila 1 ── */}
      <Row className="g-4 mb-4">

        <Col lg={4}>
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4">
              <div className="chart-header">
                <BarChart2 size={18} style={{ color: '#6366f1' }} />
                <span>Proyectos por Estado</span>
              </div>
              {proyectosEstado.length === 0
                ? <p className="text-muted small mt-3">Sin datos disponibles</p>
                : (
                  <div className="chart-bars mt-3">
                    {proyectosEstado.map(p => (
                      <div key={p.label} className="chart-bar-row">
                        <span className="chart-bar-label">{ESTADO_LABELS[p.label] ?? p.label}</span>
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{
                              width: `${(p.cantidad / maxProyecto) * 100}%`,
                              background: PROYECTO_COLORS[p.label] ?? '#6366f1',
                            }}
                          />
                        </div>
                        <span className="chart-bar-value">{p.cantidad}</span>
                      </div>
                    ))}
                  </div>
                )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4">
              <div className="chart-header">
                <Zap size={18} style={{ color: '#f59e0b' }} />
                <span>Tareas por Prioridad</span>
              </div>
              {tareasPrioridad.length === 0
                ? <p className="text-muted small mt-3">Sin datos disponibles</p>
                : (
                  <div className="chart-bars mt-3">
                    {tareasPrioridad.map(t => (
                      <div key={t.label} className="chart-bar-row">
                        <span className="chart-bar-label">{ESTADO_LABELS[t.label] ?? t.label}</span>
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{
                              width: `${(t.cantidad / maxTarea) * 100}%`,
                              background: PRIORIDAD_COLORS[t.label] ?? '#6366f1',
                            }}
                          />
                        </div>
                        <span className="chart-bar-value">{t.cantidad}</span>
                      </div>
                    ))}
                  </div>
                )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4">
              <div className="chart-header">
                <TrendingUp size={18} style={{ color: '#10b981' }} />
                <span>Distribución de Tareas</span>
              </div>
              {tareasEstado.length === 0
                ? <p className="text-muted small mt-3">Sin datos disponibles</p>
                : (
                  <>
                    <div className="stacked-bar mt-4">
                      {tareasEstado.map(t => (
                        <div
                          key={t.label}
                          className="stacked-segment"
                          title={`${ESTADO_LABELS[t.label] ?? t.label}: ${t.cantidad}`}
                          style={{
                            width: `${(t.cantidad / totalTareasEstado) * 100}%`,
                            background: TAREA_ESTADO_COLORS[t.label] ?? '#6366f1',
                          }}
                        />
                      ))}
                    </div>
                    <div className="legend mt-3">
                      {tareasEstado.map(t => (
                        <div key={t.label} className="legend-item">
                          <span className="legend-dot" style={{ background: TAREA_ESTADO_COLORS[t.label] ?? '#6366f1' }} />
                          <span className="legend-label">{ESTADO_LABELS[t.label] ?? t.label}</span>
                          <span className="legend-count">{t.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Gráficos fila 2 ── */}
      <Row className="g-4">

        <Col lg={6}>
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4">
              <div className="chart-header">
                <Users size={18} style={{ color: '#8b5cf6' }} />
                <span>Carga de Trabajo — Top 5</span>
              </div>
              {cargaTrabajo.length === 0
                ? <p className="text-muted small mt-3">Sin asignaciones registradas</p>
                : (
                  <div className="carga-list mt-3">
                    {cargaTrabajo.map((c, i) => (
                      <div key={i} className="carga-row">
                        <div className="carga-avatar">{getInitials(c.nombre)}</div>
                        <div className="carga-info">
                          <div className="carga-nombre">{c.nombre}</div>
                          <div className="carga-track">
                            <div
                              className="carga-fill"
                              style={{ width: `${(c.totalHoras / maxCarga) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="carga-horas">{c.totalHoras}h</span>
                      </div>
                    ))}
                  </div>
                )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4">
              <div className="chart-header">
                <Activity size={18} className="text-primary" />
                <span>Actividad Reciente</span>
              </div>
              <div className="activity-list mt-2">
                {recentActivities.map(item => (
                  <div key={item.id} className="activity-item d-flex align-items-center py-3 border-bottom border-light">
                    <div className="activity-dot" />
                    <div className="ms-3">
                      <p className="mb-0 fw-500">{item.titulo}</p>
                      <small className="text-muted">
                        {new Date(item.fechaCreacion).toLocaleString('es-CL')}
                      </small>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-4 text-muted">No hay actividad reciente.</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
