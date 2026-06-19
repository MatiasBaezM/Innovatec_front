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

  const feed = (actividades: unknown[], porAprobar: unknown[] = []) =>
    okJson({ actividades, porAprobar });

  it('renderiza el menú, el usuario y el contenido', () => {
    vi.stubGlobal('fetch', vi.fn(() => feed([])));
    render(<GestorLayout><div>Tablero</div></GestorLayout>);
    expect(screen.getByText('Mis Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Gus Torres')).toBeInTheDocument();
    expect(screen.getByText('Tablero')).toBeInTheDocument();
  });

  it('marca como activo Mis Proyectos en la ruta de proyectos', () => {
    vi.stubGlobal('fetch', vi.fn(() => feed([])));
    render(<GestorLayout><div /></GestorLayout>);
    expect(screen.getByText('Mis Proyectos').closest('a')).toHaveClass('active');
  });

  it('carga y muestra la actividad de sus trabajadores', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      feed([{ id: 1, titulo: 'Juan completó la tarea "Login"', fechaCreacion: '2026-06-01T10:00:00Z', tipo: 'COMPLETADO' }]),
    ));
    render(<GestorLayout><div /></GestorLayout>);
    expect(await screen.findByText('Juan completó la tarea "Login"')).toBeInTheDocument();
  });

  it('destaca las tareas por aprobar y permite aprobarlas', async () => {
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (typeof url === 'string' && url.endsWith('/actividades/gestor')) {
        return feed([], [{ id: 5, proyectoId: 2, proyectoNombre: 'Proyecto A', titulo: 'Login', asignadoNombre: 'Juan' }]);
      }
      // GET tarea completa, luego PUT REVISADO
      if (opts?.method === 'PUT') return okJson({ id: 5, estado: 'REVISADO' });
      return okJson({ id: 5, proyectoId: 2, titulo: 'Login', estado: 'COMPLETADO' });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<GestorLayout><div /></GestorLayout>);
    expect(await screen.findByText(/Por aprobar/i)).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Aprobar/i }));
    // se llamó al PUT de actualización de la tarea
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/proyectos/2/tareas/5'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('muestra vacío cuando no hay actividad y permite cerrar sesión', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));
    render(<GestorLayout><div /></GestorLayout>);
    expect(await screen.findByText(/Sin actividad registrada/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(logoutMock).toHaveBeenCalled();
  });
});
