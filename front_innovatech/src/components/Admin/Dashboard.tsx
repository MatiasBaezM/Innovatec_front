import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Proyectos Activos', value: '12', icon: '🚀', color: '#6366f1' },
    { label: 'Colaboradores', value: '45', icon: '👥', color: '#8b5cf6' },
    { label: 'Tareas Pendientes', value: '8', icon: '📋', color: '#f59e0b' },
    { label: 'Presupuesto Usado', value: '75%', icon: '💰', color: '#10b981' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header mb-5">
        <h1 className="dashboard-title">Panel de Control</h1>
        <p className="dashboard-subtitle text-muted">Bienvenido de nuevo, administrador.</p>
      </header>

      <Row className="g-4 mb-5">
        {stats.map((stat, idx) => (
          <Col key={idx} xs={12} sm={6} lg={3}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div>
                  <div className="stat-label text-muted small">{stat.label}</div>
                  <div className="stat-value h4 mb-0 fw-bold">{stat.value}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={12}>
          <Card className="dashboard-card border-0 shadow-sm p-4">
            <h4 className="mb-4">Actividad Reciente</h4>
            <div className="activity-list">
              {[1, 2, 3].map((item) => (
                <div key={item} className="activity-item d-flex align-items-center py-3 border-bottom border-light">
                  <div className="activity-dot"></div>
                  <div className="ms-3">
                    <p className="mb-0 fw-500">Nuevo proyecto creado: "Sistema Innovatech"</p>
                    <small className="text-muted">Hace 2 horas</small>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
