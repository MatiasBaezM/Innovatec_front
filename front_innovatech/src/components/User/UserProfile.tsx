import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { User, Shield, Hash, Activity, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import { type Habilidad, loadSkillsFromStorage, loadUserSkillIds } from '../../utils/skillsUtils';
import './UserProfile.css';

interface Actividad {
  id: number;
  titulo: string;
  fechaCreacion: string;
}

const ROL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ADMINISTRADOR:     { label: 'Administrador',     color: '#6366f1', bg: '#ede9fe' },
  GESTOR_PROYECTOS:  { label: 'Gestor de Proyectos', color: '#8b5cf6', bg: '#f3e8ff' },
  COLABORADOR:       { label: 'Colaborador',       color: '#0ea5e9', bg: '#e0f2fe' },
  ANALISTA:          { label: 'Analista',           color: '#10b981', bg: '#d1fae5' },
};

const UserProfile: React.FC = () => {
  const { userInfo } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [misHabilidades, setMisHabilidades] = useState<Habilidad[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setActividades(data.slice(0, 8)))
      .catch(() => setActividades([]));

    if (userInfo?.id) {
      const allSkills = loadSkillsFromStorage();
      const ids = loadUserSkillIds(userInfo.id);
      setMisHabilidades(allSkills.filter(s => ids.includes(s.id)));
    }
  }, [userInfo?.id]);

  const rolCfg = ROL_CONFIG[userInfo?.rol ?? ''] ?? {
    label: userInfo?.rol ?? 'Usuario',
    color: '#64748b',
    bg: '#f1f5f9',
  };

  const initials = userInfo?.nombre
    ? userInfo.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="user-profile">
      <header className="uprof-header">
        <h1 className="uprof-title">Mi Perfil</h1>
        <p className="uprof-subtitle">Información de tu cuenta.</p>
      </header>

      <Row className="g-4">
        {/* Tarjeta de perfil */}
        <Col lg={4}>
          <Card className="uprof-card border-0 shadow-sm">
            <Card.Body className="p-4 text-center">
              <div className="uprof-avatar">{initials}</div>
              <h4 className="uprof-name">{userInfo?.nombre || 'Usuario'}</h4>
              <Badge
                className="uprof-rol-badge"
                style={{ backgroundColor: rolCfg.bg, color: rolCfg.color }}
              >
                {rolCfg.label}
              </Badge>

              <hr className="uprof-divider" />

              <div className="uprof-info-list">
                <div className="uprof-info-item">
                  <Hash size={16} className="uprof-info-icon" />
                  <div>
                    <span className="uprof-info-label">RUT</span>
                    <span className="uprof-info-value">{userInfo?.rut || '—'}</span>
                  </div>
                </div>
                <div className="uprof-info-item">
                  <Shield size={16} className="uprof-info-icon" />
                  <div>
                    <span className="uprof-info-label">Rol</span>
                    <span className="uprof-info-value">{rolCfg.label}</span>
                  </div>
                </div>
                <div className="uprof-info-item">
                  <User size={16} className="uprof-info-icon" />
                  <div>
                    <span className="uprof-info-label">Nombre</span>
                    <span className="uprof-info-value">{userInfo?.nombre || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Habilidades */}
              <hr className="uprof-divider" />
              <div className="text-start">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Tag size={14} style={{ color: '#f59e0b' }} />
                  <span className="uprof-info-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Habilidades
                  </span>
                </div>
                {misHabilidades.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.82rem' }}>Sin habilidades asignadas.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {misHabilidades.map(h => (
                      <span
                        key={h.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.25em 0.7em',
                          borderRadius: '8px',
                          backgroundColor: h.color + '22',
                          color: h.color,
                          border: `1px solid ${h.color}44`,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                        {h.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Actividad */}
        <Col lg={8}>
          <Card className="uprof-card border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Activity size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Historial de Actividad</h5>
              </div>

              {actividades.length === 0 ? (
                <div className="uprof-empty">Sin actividad registrada.</div>
              ) : (
                <div className="uprof-activity-list">
                  {actividades.map(a => (
                    <div key={a.id} className="uprof-activity-item">
                      <div className="uprof-timeline-dot" />
                      <div className="uprof-activity-body">
                        <p className="uprof-activity-title">{a.titulo}</p>
                        <small className="uprof-activity-date">
                          {new Date(a.fechaCreacion).toLocaleDateString('es-CL', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
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

export default UserProfile;
