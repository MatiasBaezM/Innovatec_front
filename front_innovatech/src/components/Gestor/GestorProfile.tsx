import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { User, Shield, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordCard from '../common/ChangePasswordCard';
import '../User/UserProfile.css';

const GestorProfile: React.FC = () => {
  const { userInfo } = useAuth();

  const initials = userInfo?.nombre
    ? userInfo.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'G';

  return (
    <div className="user-profile">
      <header className="uprof-header">
        <h1 className="uprof-title">Mi Perfil</h1>
        <p className="uprof-subtitle">Información de tu cuenta y seguridad.</p>
      </header>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="uprof-card border-0 shadow-sm">
            <Card.Body className="p-4 text-center">
              <div className="uprof-avatar">{initials}</div>
              <h4 className="uprof-name">{userInfo?.nombre || 'Gestor'}</h4>
              <Badge
                className="uprof-rol-badge"
                style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}
              >
                Gestor de Proyectos
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
                    <span className="uprof-info-value">Gestor de Proyectos</span>
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
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <ChangePasswordCard />
        </Col>
      </Row>
    </div>
  );
};

export default GestorProfile;
