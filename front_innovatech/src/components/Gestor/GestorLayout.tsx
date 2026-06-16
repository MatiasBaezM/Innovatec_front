import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FolderKanban, LogOut, Menu, X, User, Activity } from 'lucide-react';
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
}

const GestorLayout: React.FC<GestorLayoutProps> = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const location = useLocation();
  const { userInfo, logout } = useAuth();

  const menuItems = [
    { path: '/gestor/proyectos', label: 'Mis Proyectos', icon: <FolderKanban size={20} />, match: (p: string) => p === '/gestor' || p.startsWith('/gestor/proyectos') },
    { path: '/gestor/perfil', label: 'Mi Perfil', icon: <User size={20} />, match: (p: string) => p.startsWith('/gestor/perfil') },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setActividades(Array.isArray(data) ? data.slice(0, 10) : []))
      .catch(() => setActividades([]));
    // Refresca al cambiar de ruta para reflejar cambios de estado / tareas terminadas
  }, [location.pathname]);

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

        {/* Registro de actividades recientes */}
        <div className="gestor-activity-panel" style={{
          flex: 1, overflowY: 'auto', padding: '0.5rem 0.85rem', minHeight: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '.05em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
            margin: '0.5rem 0 0.75rem',
          }}>
            <Activity size={14} />
            <span>Actividad reciente</span>
          </div>
          {actividades.length === 0 ? (
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
              Sin actividad registrada.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {actividades.map(a => (
                <li key={a.id} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6',
                    flexShrink: 0, marginTop: '0.35rem',
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.3 }}>
                      {a.titulo}
                    </p>
                    <small style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(a.fechaCreacion).toLocaleDateString('es-CL', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </small>
                  </div>
                </li>
              ))}
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
