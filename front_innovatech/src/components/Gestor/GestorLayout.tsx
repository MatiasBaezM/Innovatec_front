import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FolderKanban, LogOut, Menu, X, User, Activity, CheckCircle, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import '../Admin/AdminLayout.css';
import '../Admin/Sidebar.css';

interface GestorLayoutProps {
  children: React.ReactNode;
}

interface Actividad {
  id: number;
  titulo: string;
  fechaCreacion: string;
  trabajadorNombre?: string;
  proyectoNombre?: string;
  tipo?: string;
}

interface TareaPorAprobar {
  id: number;
  proyectoId: number;
  proyectoNombre?: string;
  titulo: string;
  asignadoNombre?: string;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const GestorLayout: React.FC<GestorLayoutProps> = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [porAprobar, setPorAprobar] = useState<TareaPorAprobar[]>([]);
  const [aprobandoId, setAprobandoId] = useState<number | null>(null);
  const location = useLocation();
  const { userInfo, logout } = useAuth();

  const menuItems = [
    { path: '/gestor/proyectos', label: 'Mis Proyectos', icon: <FolderKanban size={20} />, match: (p: string) => p === '/gestor' || p.startsWith('/gestor/proyectos') },
    { path: '/gestor/perfil', label: 'Mi Perfil', icon: <User size={20} />, match: (p: string) => p.startsWith('/gestor/perfil') },
  ];

  const cargarFeed = useCallback(() => {
    fetch(API_ENDPOINTS.PROJECTS.GESTOR_ACTIVITIES, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setActividades(Array.isArray(data?.actividades) ? data.actividades.slice(0, 15) : []);
        setPorAprobar(Array.isArray(data?.porAprobar) ? data.porAprobar : []);
      })
      .catch(() => { setActividades([]); setPorAprobar([]); });
  }, []);

  useEffect(() => {
    // Refresca al cambiar de ruta para reflejar cambios de estado / tareas terminadas
    cargarFeed();
  }, [location.pathname, cargarFeed]);

  // Aprobar = traer la tarea completa y reenviarla con estado REVISADO (evita
  // borrar campos por update parcial). Tras aprobar, refresca el feed.
  const aprobarTarea = async (t: TareaPorAprobar) => {
    setAprobandoId(t.id);
    try {
      const url = API_ENDPOINTS.PROJECTS.TASK(t.proyectoId, t.id);
      const tarea = await fetch(url, { headers: authHeaders() }).then(r => r.ok ? r.json() : Promise.reject());
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...tarea, estado: 'REVISADO', mensajeCorreccion: null }),
      });
      if (!res.ok) throw new Error();
      setPorAprobar(prev => prev.filter(x => x.id !== t.id));
      cargarFeed();
    } catch {
      /* error de red: se deja la tarea en la lista para reintentar */
    } finally {
      setAprobandoId(null);
    }
  };

  return (
    <div className={`admin-layout ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-logo">Innovatech</h3>
          {userInfo && (
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Gestor de Proyectos
            </p>
          )}
        </div>

        <nav className="flex-column sidebar-nav" style={{ flexGrow: 0 }}>
          {menuItems.map(item => (
            <div key={item.path}>
              <Link
                to={item.path}
                className={`sidebar-link ${item.match(location.pathname) ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        {/* Panel del gestor: tareas por aprobar + actividad de sus trabajadores */}
        <div className="gestor-activity-panel" style={{
          flex: 1, overflowY: 'auto', padding: '0.5rem 0.85rem', minHeight: 0,
        }}>
          {/* ── Destacado: tareas que el gestor debe aprobar ── */}
          {porAprobar.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '.05em',
                textTransform: 'uppercase', color: '#fcd34d',
                margin: '0.5rem 0 0.75rem',
              }}>
                <ClipboardCheck size={14} />
                <span>Por aprobar ({porAprobar.length})</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {porAprobar.map(t => (
                  <li key={t.id} style={{
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    borderRadius: 8, padding: '0.55rem 0.6rem',
                  }}>
                    <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.92)', margin: 0, fontWeight: 600, lineHeight: 1.3 }}>
                      {t.titulo}
                    </p>
                    <small style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 2 }}>
                      {t.asignadoNombre ?? 'Colaborador'}{t.proyectoNombre ? ` · ${t.proyectoNombre}` : ''}
                    </small>
                    <button
                      onClick={() => aprobarTarea(t)}
                      disabled={aprobandoId === t.id}
                      style={{
                        marginTop: '0.5rem', width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        padding: '0.3rem', borderRadius: 6, border: 'none',
                        background: '#10b981', color: '#fff',
                        fontSize: '0.72rem', fontWeight: 600,
                        cursor: aprobandoId === t.id ? 'wait' : 'pointer',
                        opacity: aprobandoId === t.id ? 0.7 : 1,
                      }}
                    >
                      <CheckCircle size={13} /> {aprobandoId === t.id ? 'Aprobando...' : 'Aprobar'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '.05em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
            margin: '0.5rem 0 0.75rem',
          }}>
            <Activity size={14} />
            <span>Actividad de mis trabajadores</span>
          </div>
          {actividades.length === 0 ? (
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
              Sin actividad registrada.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {actividades.map(a => {
                const dot = a.tipo === 'COMPLETADO' ? '#10b981'
                  : a.tipo === 'REVISADO' ? '#8b5cf6'
                  : a.tipo === 'RECHAZADO' ? '#ef4444'
                  : a.tipo === 'EN_PROGRESO' ? '#6366f1'
                  : '#64748b';
                return (
                  <li key={a.id} style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', background: dot,
                      flexShrink: 0, marginTop: '0.35rem',
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.3 }}>
                        {a.titulo}
                      </p>
                      <small style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                        {a.proyectoNombre ? `${a.proyectoNombre} · ` : ''}
                        {new Date(a.fechaCreacion).toLocaleDateString('es-CL', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          {userInfo && (
            <div className="sidebar-user-row" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.85rem', marginBottom: '0.35rem',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(139,92,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={13} color="#c4b5fd" />
              </div>
              <span className="sidebar-user-name" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userInfo.nombre}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="sidebar-link logout"
            style={{ width: '100%', background: 'none', border: 'none' }}
          >
            <span className="sidebar-icon"><LogOut size={18} /></span>
            <span className="sidebar-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="admin-content">
        <div className="admin-topbar">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
            title="Alternar panel lateral"
          >
            {isSidebarHidden ? <Menu size={24} /> : <X size={24} />}
          </button>
        </div>
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default GestorLayout;
