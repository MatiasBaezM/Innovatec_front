import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GestorLayout from './GestorLayout';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/gestor/proyectos' }),
  Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
}));

const logoutMock = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ userInfo: { nombre: 'Gus Torres' }, logout: logoutMock }),
}));

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

describe('GestorLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    logoutMock.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('renderiza el menú, el usuario y el contenido', () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson([])));
    render(<GestorLayout><div>Tablero</div></GestorLayout>);
    expect(screen.getByText('Mis Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Gus Torres')).toBeInTheDocument();
    expect(screen.getByText('Tablero')).toBeInTheDocument();
  });

  it('marca como activo Mis Proyectos en la ruta de proyectos', () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson([])));
    render(<GestorLayout><div /></GestorLayout>);
    expect(screen.getByText('Mis Proyectos').closest('a')).toHaveClass('active');
  });

  it('carga y muestra la actividad reciente', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      okJson([{ id: 1, titulo: 'Tarea aprobada', fechaCreacion: '2026-06-01T10:00:00Z' }]),
    ));
    render(<GestorLayout><div /></GestorLayout>);
    expect(await screen.findByText('Tarea aprobada')).toBeInTheDocument();
  });

  it('muestra vacío cuando no hay actividad y permite cerrar sesión', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));
    render(<GestorLayout><div /></GestorLayout>);
    expect(await screen.findByText(/Sin actividad registrada/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(logoutMock).toHaveBeenCalled();
  });
});
