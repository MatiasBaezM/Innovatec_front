import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { BarChart2, Zap, TrendingUp, Users, DollarSign, Rocket, ClipboardList, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import './Dashboard.css';
import './Analytics.css';

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

interface CostoProyecto {
  proyectoId: number;
  costoEstimado: number;
}

interface Proyecto {
  id: number;
  nombre: string;
}

const ESTADO_LABELS: Record<string, string> = {
  INICIO: 'Inicio', EN_PROGRESO: 'En Progreso', FINALIZADO: 'Finalizado',
  POR_HACER: 'Por Hacer', COMPLETADO: 'Completado',
  ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja',
};

const PROYECTO_COLORS: Record<string, string> = {
  INICIO: '#f59e0b', EN_PROGRESO: '#6366f1', FINALIZADO: '#10b981',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  ALTA: '#ef4444', MEDIA: '#f59e0b', BAJA: '#10b981',
};

const TAREA_ESTADO_COLORS: Record<string, string> = {
  POR_HACER: '#64748b', EN_PROGRESO: '#6366f1', COMPLETADO: '#10b981',
};

function getInitials(nombre: string) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function downloadCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const content = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const Analytics: React.FC = () => {
  const [resumen, setResumen] = React.useState<Resumen | null>(null);
  const [proyectosEstado, setProyectosEstado] = React.useState<GrupoConteo[]>([]);
  const [tareasPrioridad, setTareasPrioridad] = React.useState<GrupoConteo[]>([]);
  const [tareasEstado, setTareasEstado] = React.useState<GrupoConteo[]>([]);
  const [cargaTrabajo, setCargaTrabajo] = React.useState<CargaTrabajo[]>([]);
  const [costos, setCostos] = React.useState<CostoProyecto[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);

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
      fetch(`${BASE}/costos`,           { headers }).then(r => r.ok ? r.json() : []),
      fetch(API_ENDPOINTS.PROJECTS.BASE, { headers }).then(r => r.ok ? r.json() : []),
    ]).then(results => {
      const vals = results.map(r => r.status === 'fulfilled' ? r.value : null);
      if (vals[0]) setResumen(vals[0]);
      if (vals[1]) setProyectosEstado(vals[1]);
      if (vals[2]) setTareasPrioridad(vals[2]);
      if (vals[3]) setTareasEstado(vals[3]);
      if (vals[4]) setCargaTrabajo(vals[4]);
      if (vals[5]) setCostos(vals[5]);
      if (vals[6]) setProyectos(vals[6]);
    });
  }, []);

  const getNombre = (id: number) =>
    proyectos.find(p => p.id === id)?.nombre ?? `Proyecto #${id}`;

  const maxCosto   = Math.max(...costos.map(c => c.costoEstimado), 1);
  const maxProy    = Math.max(...proyectosEstado.map(p => p.cantidad), 1);
  const maxTarea   = Math.max(...tareasPrioridad.map(t => t.cantidad), 1);
  const maxCarga   = Math.max(...cargaTrabajo.map(c => c.totalHoras), 1);
  const totalEstado = tareasEstado.reduce((s, t) => s + t.cantidad, 0) || 1;

  const handleExport = () => {
    if (!resumen) return;
    downloadCSV('reporte_analiticas.csv',
      ['Métrica', 'Valor'],
      [
        ['Total Proyectos',      resumen.totalProyectos],
        ['Proyectos Activos',    resumen.proyectosActivos],
        ['Total Colaboradores',  resumen.totalTrabajadores],
        ['Tareas Pendientes',    resumen.tareasPendientes],
        ['Tareas Completadas',   resumen.tareasCompletadas],
        ['Presupuesto Total',    resumen.presupuestoTotal.toFixed(2)],
        ...costos.map(c => [`Costo – ${getNombre(c.proyectoId)}`, c.costoEstimado.toFixed(2)]),
        ...cargaTrabajo.map(c => [`Horas – ${c.nombre}`, c.totalHoras]),
      ]
    );
  };

  const kpis = [
    { label: 'Proyectos Activos',   value: resumen?.proyectosActivos ?? '—',  sub: resumen ? `de ${resumen.totalProyectos} totales` : '',            icon: <Rocket       size={22} />, color: '#6366f1' },
    { label: 'Colaboradores',       value: resumen?.totalTrabajadores ?? '—', sub: 'en el sistema',                                                   icon: <Users        size={22} />, color: '#8b5cf6' },
    { label: 'Tareas Pendientes',   value: resumen?.tareasPendientes ?? '—',  sub: resumen ? `${resumen.tareasCompletadas} completadas` : '',          icon: <ClipboardList size={22} />, color: '#f59e0b' },
    { label: 'Presupuesto Total',   value: resumen ? `$${resumen.presupuestoTotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : '—', sub: 'horas × tarifa', icon: <DollarSign  size={22} />, color: '#10b981' },
  ];

  return (
    <div className="analytics-page">
      <header className="d-flex justify-content-between align-items-start mb-5">
        <div>
          <h1 className="dashboard-title">Analíticas</h1>
          <p className="text-muted">Métricas detalladas del rendimiento del sistema.</p>
        </div>
        <Button className="analytics-export-btn" onClick={handleExport} disabled={!resumen}>
          <Download size={15} className="me-2" />
          Exportar CSV
        </Button>
      </header>

      {/* KPIs */}
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

      {/* Costos + Resumen */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4">
              <div className="chart-header">
                <DollarSign size={18} style={{ color: '#10b981' }} />
                <span>Costo Estimado por Proyecto</span>
              </div>
              {costos.length === 0
                ? <p className="text-muted small mt-3">Sin datos de costos disponibles</p>
                : (
                  <div className="chart-bars mt-3">
                    {costos.map(c => (
                      <div key={c.proyectoId} className="chart-bar-row">
                        <span className="chart-bar-label" style={{ width: 120 }}>{getNombre(c.proyectoId)}</span>
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{ width: `${(c.costoEstimado / maxCosto) * 100}%`, background: '#10b981' }}
                          />
                        </div>
                        <span className="chart-bar-value" style={{ width: 80, fontSize: '0.72rem' }}>
                          ${c.costoEstimado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                        </span>
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
                <TrendingUp size={18} style={{ color: '#6366f1' }} />
                <span>Resumen General</span>
              </div>
              {resumen ? (
                <div className="analytics-summary mt-3">
                  {[
                    { label: 'Total proyectos',       value: resumen.totalProyectos },
                    { label: 'Proyectos activos',     value: resumen.proyectosActivos },
                    { label: 'Proyectos finalizados', value: resumen.totalProyectos - resumen.proyectosActivos },
                    { label: 'Colaboradores',         value: resumen.totalTrabajadores },
                    { label: 'Tareas pendientes',     value: resumen.tareasPendientes },
                    { label: 'Tareas completadas',    value: resumen.tareasCompletadas },
                  ].map(item => (
                    <div key={item.label} className="analytics-summary-row">
                      <span className="analytics-summary-label">{item.label}</span>
                      <span className="analytics-summary-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small mt-3">Sin datos</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
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
                          <div className="chart-bar-fill" style={{ width: `${(p.cantidad / maxProy) * 100}%`, background: PROYECTO_COLORS[p.label] ?? '#6366f1' }} />
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
                          <div className="chart-bar-fill" style={{ width: `${(t.cantidad / maxTarea) * 100}%`, background: PRIORIDAD_COLORS[t.label] ?? '#6366f1' }} />
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
                          style={{ width: `${(t.cantidad / totalEstado) * 100}%`, background: TAREA_ESTADO_COLORS[t.label] ?? '#6366f1' }}
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

      {/* Carga de trabajo */}
      <Row className="g-4">
        <Col lg={12}>
          <Card className="dashboard-card border-0">
            <Card.Body className="p-4">
              <div className="chart-header">
                <Users size={18} style={{ color: '#8b5cf6' }} />
                <span>Carga de Trabajo — Top 5</span>
              </div>
              {cargaTrabajo.length === 0
                ? <p className="text-muted small mt-3">Sin asignaciones registradas</p>
                : (
                  <Row className="mt-3">
                    {cargaTrabajo.map((c, i) => (
                      <Col key={i} xs={12} md={6} className="mb-3">
                        <div className="carga-row">
                          <div className="carga-avatar">{getInitials(c.nombre)}</div>
                          <div className="carga-info">
                            <div className="carga-nombre">{c.nombre}</div>
                            <div className="carga-track">
                              <div className="carga-fill" style={{ width: `${(c.totalHoras / maxCarga) * 100}%` }} />
                            </div>
                          </div>
                          <span className="carga-horas">{c.totalHoras}h</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
