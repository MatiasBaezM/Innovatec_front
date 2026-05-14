import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Rocket, Users, ClipboardList, DollarSign, Activity } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Proyectos Activos', value: '12', icon: <Rocket size={24} />, color: '#6366f1' },
    { label: 'Colaboradores', value: '45', icon: <Users size={24} />, color: '#8b5cf6' },
    { label: 'Tareas Pendientes', value: '8', icon: <ClipboardList size={24} />, color: '#f59e0b' },
    { label: 'Presupuesto Usado', value: '75%', icon: <DollarSign size={24} />, color: '#10b981' },
  ];

  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.PROJECTS.ACTIVITIES);
        if (response.ok) {
          const data = await response.json();
          setRecentActivities(data);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };
    fetchActivities();
  }, []);

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
            <div className="d-flex align-items-center mb-4">
              <Activity size={20} className="me-2 text-primary" />
              <h4 className="mb-0">Actividad Reciente</h4>
            </div>
            <div className="activity-list">
              {recentActivities.map((item) => (
                <div key={item.id} className="activity-item d-flex align-items-center py-3 border-bottom border-light">
                  <div className="activity-dot" style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366f1'}}></div>
                  <div className="ms-3">
                    <p className="mb-0 fw-500">{item.titulo}</p>
                    <small className="text-muted">{new Date(item.fechaCreacion).toLocaleString()}</small>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center py-4 text-muted">
                  No hay actividad reciente.
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
