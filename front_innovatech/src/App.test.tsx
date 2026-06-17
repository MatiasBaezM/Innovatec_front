import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Rol controlable para los guardas de ruta
let currentRole: string | null = 'ADMINISTRADOR';
vi.mock('./context/AuthContext', () => ({
  getRoleFromToken: () => currentRole,
  // Los guards usan getValidToken; en el test refleja el token de localStorage
  getValidToken: () => localStorage.getItem('token'),
}));

// Stubs ligeros para no montar páginas reales (que hacen fetch).
// Las factorías de vi.mock se hoistean: deben ser autocontenidas.
vi.mock('./components/Login/Login', () => ({ default: () => <div>LoginPage</div> }));
vi.mock('./components/Admin/AdminLayout', () => ({ default: ({ children }: any) => <div>AdminLayout{children}</div> }));
vi.mock('./components/Admin/Dashboard', () => ({ default: () => <div>DashboardPage</div> }));
vi.mock('./components/Admin/UsersManagement', () => ({ default: () => <div>UsersPage</div> }));
vi.mock('./components/Admin/ProjectsManagement', () => ({ default: () => <div>ProjectsPage</div> }));
vi.mock('./components/Admin/Config', () => ({ default: () => <div>ConfigPage</div> }));
vi.mock('./components/Gestor/GestorLayout', () => ({ default: ({ children }: any) => <div>GestorLayout{children}</div> }));
vi.mock('./components/Gestor/GestorProjects', () => ({ default: () => <div>GestorProjectsPage</div> }));
vi.mock('./components/Gestor/GestorTaskBoard', () => ({ default: () => <div>GestorTaskBoardPage</div> }));
vi.mock('./components/Gestor/GestorProfile', () => ({ default: () => <div>GestorProfilePage</div> }));
vi.mock('./components/User/UserLayout', () => ({ default: ({ children }: any) => <div>UserLayout{children}</div> }));
vi.mock('./components/User/UserDashboard', () => ({ default: () => <div>UserDashboardPage</div> }));
vi.mock('./components/User/UserProjects', () => ({ default: () => <div>UserProjectsPage</div> }));
vi.mock('./components/User/UserProfile', () => ({ default: () => <div>UserProfilePage</div> }));
vi.mock('./components/User/TaskBoard', () => ({ default: () => <div>TaskBoardPage</div> }));

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

describe('App (rutas y guardas)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('redirige la raíz al login', () => {
    renderAt('/');
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('sin token, una ruta protegida redirige al login', () => {
    currentRole = 'ADMINISTRADOR';
    renderAt('/analiticas');
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('admin autenticado accede a las analíticas', () => {
    localStorage.setItem('token', 'tok');
    currentRole = 'ADMINISTRADOR';
    renderAt('/analiticas');
    expect(screen.getByText('DashboardPage')).toBeInTheDocument();
  });

  it('un gestor que entra a ruta de admin es redirigido a /gestor', () => {
    localStorage.setItem('token', 'tok');
    currentRole = 'GESTOR_PROYECTOS';
    renderAt('/analiticas');
    expect(screen.getByText('GestorProjectsPage')).toBeInTheDocument();
  });

  it('un colaborador que entra a ruta de gestor es redirigido a /user', () => {
    localStorage.setItem('token', 'tok');
    currentRole = 'COLABORADOR';
    renderAt('/gestor');
    expect(screen.getByText('UserDashboardPage')).toBeInTheDocument();
  });

  it('una ruta desconocida redirige al login', () => {
    renderAt('/ruta-inexistente');
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });
});
