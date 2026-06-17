import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDashboard from './UserDashboard';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ userInfo: { id: 5, nombre: 'Juan Pérez', rut: '11.111.111-1', rol: 'COLABORADOR' } }),
}));

const proyectos = [
  { id: 1, nombre: 'Plataforma Digital', descripcion: 'Web', estado: 'EN_PROGRESO' },
  { id: 2, nombre: 'Integración ERP', descripcion: 'ERP', estado: 'FINALIZADO' },
];
const actividades = [{ id: 1, titulo: 'Tarea creada', fechaCreacion: '2026-06-01T10:00:00Z' }];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn((url: string) =>
    url.includes('/actividades') ? okJson(actividades) : okJson(proyectos),
  ));
}

describe('UserDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('saluda al usuario por su primer nombre', async () => {
    stubFetch();
    render(<UserDashboard />);
    expect(screen.getByText('Hola, Juan')).toBeInTheDocument();
  });

  it('muestra los proyectos asignados y la actividad reciente', async () => {
    stubFetch();
    render(<UserDashboard />);
    expect(await screen.findByText('Plataforma Digital')).toBeInTheDocument();
    expect(screen.getByText('Tarea creada')).toBeInTheDocument();
  });

  it('navega al tablero al hacer click en un proyecto', async () => {
    stubFetch();
    render(<UserDashboard />);
    await userEvent.click(await screen.findByText('Plataforma Digital'));
    expect(navigateMock).toHaveBeenCalledWith('/user/proyectos/1');
  });

  it('cae a proyectos de respaldo si la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) =>
      url.includes('/actividades')
        ? Promise.resolve({ ok: false } as Response)
        : Promise.resolve({ ok: false } as Response),
    ));
    render(<UserDashboard />);
    expect(await screen.findByText('App Móvil Clientes')).toBeInTheDocument();
  });
});
