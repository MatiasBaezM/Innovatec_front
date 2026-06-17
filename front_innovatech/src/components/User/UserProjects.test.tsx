import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProjects from './UserProjects';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const proyectos = [
  { id: 1, nombre: 'Plataforma Digital', descripcion: 'Portal web', estado: 'EN_PROGRESO',
    colaboradores: [{ id: 1, nombre: 'Juan Pérez' }, { id: 2, nombre: 'María Silva' }] },
  { id: 2, nombre: 'App Móvil', descripcion: 'Clientes', estado: 'INICIO', colaboradores: [] },
];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

describe('UserProjects', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los proyectos del usuario', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<UserProjects />);
    expect(await screen.findByText('Plataforma Digital')).toBeInTheDocument();
    expect(screen.getByText('App Móvil')).toBeInTheDocument();
  });

  it('usa datos de respaldo cuando la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));
    render(<UserProjects />);
    // MOCK interno incluye "Integración ERP"
    expect(await screen.findByText('Integración ERP')).toBeInTheDocument();
  });

  it('filtra por búsqueda de texto', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<UserProjects />);
    await screen.findByText('Plataforma Digital');
    await userEvent.type(screen.getByPlaceholderText(/Buscar proyectos/i), 'Móvil');
    expect(screen.queryByText('Plataforma Digital')).not.toBeInTheDocument();
    expect(screen.getByText('App Móvil')).toBeInTheDocument();
  });

  it('filtra por estado con los botones', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<UserProjects />);
    await screen.findByText('Plataforma Digital');
    await userEvent.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(screen.queryByText('Plataforma Digital')).not.toBeInTheDocument();
    expect(screen.getByText('App Móvil')).toBeInTheDocument();
  });

  it('navega al tablero al hacer click en una tarjeta', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<UserProjects />);
    await userEvent.click(await screen.findByText('Plataforma Digital'));
    expect(navigateMock).toHaveBeenCalledWith('/user/proyectos/1');
  });

  it('abre el modal de integrantes sin navegar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<UserProjects />);
    await screen.findByText('Plataforma Digital');
    await userEvent.click(screen.getByRole('button', { name: /2 miembros/i }));

    expect(screen.getByText(/2 integrantes/)).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
