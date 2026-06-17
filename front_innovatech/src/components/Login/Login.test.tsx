import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';

// --- Mocks de dependencias externas al componente ---
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const refreshUserMock = vi.fn();
const getRoleFromTokenMock = vi.fn<() => string | null>();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ refreshUser: refreshUserMock }),
  getRoleFromToken: () => getRoleFromTokenMock(),
  // Login auto-redirige al montar si hay token válido; reflejamos localStorage
  getValidToken: () => localStorage.getItem('token'),
}));

function rutInput() {
  return document.getElementById('formBasicRUT') as HTMLInputElement;
}
function claveInput() {
  return document.getElementById('formBasicClave') as HTMLInputElement;
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    refreshUserMock.mockClear();
    getRoleFromTokenMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el título y los campos del formulario', () => {
    render(<Login />);
    expect(screen.getByText('Innovatech')).toBeInTheDocument();
    expect(rutInput()).toBeInTheDocument();
    expect(claveInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('formatea el RUT a medida que se escribe', async () => {
    render(<Login />);
    await userEvent.type(rutInput(), '111111111');
    expect(rutInput().value).toBe('11.111.111-1');
  });

  it('muestra error y no llama a fetch si el RUT es inválido', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<Login />);
    await userEvent.type(rutInput(), '12345');
    await userEvent.type(claveInput(), 'secreta');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/RUT ingresado no es válido/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('muestra "Credenciales inválidas" cuando el backend responde con error', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));

    render(<Login />);
    await userEvent.type(rutInput(), '111111111');
    await userEvent.type(claveInput(), 'mala');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument();
  });

  it('en login exitoso guarda el token, refresca el contexto y navega según el rol', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'jwt-123' }) } as Response),
    ));
    getRoleFromTokenMock.mockReturnValue('ADMINISTRADOR');

    render(<Login />);
    await userEvent.type(rutInput(), '111111111');
    await userEvent.type(claveInput(), 'correcta');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/analiticas'));
    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(refreshUserMock).toHaveBeenCalled();
  });

  it('redirige a /gestor cuando el rol es GESTOR_PROYECTOS', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'jwt-g' }) } as Response),
    ));
    getRoleFromTokenMock.mockReturnValue('GESTOR_PROYECTOS');

    render(<Login />);
    await userEvent.type(rutInput(), '111111111');
    await userEvent.type(claveInput(), 'correcta');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/gestor'));
  });

  it('redirige a /user para roles colaboradores', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'jwt-u' }) } as Response),
    ));
    getRoleFromTokenMock.mockReturnValue('COLABORADOR');

    render(<Login />);
    await userEvent.type(rutInput(), '111111111');
    await userEvent.type(claveInput(), 'correcta');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/user'));
  });

  it('si ya hay un token al montar, redirige sin mostrar el formulario de carga', async () => {
    localStorage.setItem('token', 'ya-logueado');
    getRoleFromTokenMock.mockReturnValue('ADMINISTRADOR');

    render(<Login />);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/analiticas', { replace: true }),
    );
  });
});
