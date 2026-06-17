import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersManagement from './UsersManagement';
import { API_ENDPOINTS } from '../../config/api';

// Aislamos la capa de habilidades: el componente sólo orquesta estas funciones
const saveUserSkillIdsMock = vi.fn((..._args: unknown[]) => Promise.resolve(true));
vi.mock('../../utils/skillsUtils', () => ({
  fetchSkills: vi.fn(() => Promise.resolve([])),
  fetchUserSkillIds: vi.fn(() => Promise.resolve([])),
  saveUserSkillIds: (...args: unknown[]) => saveUserSkillIdsMock(...args),
}));

const usuarios = [
  { id: 1, nombre: 'Carlos Ruiz', rut: '11.111.111-1', rol: 'ADMINISTRADOR', correo: 'c@x.cl' },
  { id: 2, nombre: 'Ana García', rut: '22.222.222-2', rol: 'COLABORADOR' },
];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

/** Router de fetch por URL/método; permite sobreescribir la respuesta de USERS al montar. */
function stubFetch(listado: unknown[] = usuarios) {
  const fn = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/auth/users') && method === 'GET') return okJson(listado);
    if (url.includes('/auth/register')) return okJson({ id: 5 });
    return okJson({ id: 5 });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function campo(name: string): HTMLInputElement {
  const el = document.querySelector(`[name="${name}"]`);
  if (!el) throw new Error(`No se encontró el campo "${name}"`);
  return el as HTMLInputElement;
}

describe('UsersManagement', () => {
  beforeEach(() => {
    localStorage.clear();
    saveUserSkillIdsMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carga y muestra los usuarios ordenados alfabéticamente', async () => {
    stubFetch();
    render(<UsersManagement />);
    // Ana debe aparecer antes que Carlos por el sort por nombre
    await screen.findByText('Ana García');
    const filas = screen.getAllByRole('row');
    const nombres = filas.map(r => r.textContent).join(' | ');
    expect(nombres.indexOf('Ana García')).toBeLessThan(nombres.indexOf('Carlos Ruiz'));
  });

  it('usa datos de respaldo cuando la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<UsersManagement />);
    expect(await screen.findByText('Admin Innovatech')).toBeInTheDocument();
  });

  it('filtra usuarios por el término de búsqueda', async () => {
    stubFetch();
    render(<UsersManagement />);
    await screen.findByText('Ana García');

    await userEvent.type(screen.getByPlaceholderText(/Buscar por nombre o RUT/i), 'Ana');

    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Ruiz')).not.toBeInTheDocument();
  });

  it('rechaza el alta cuando el RUT es inválido y no llama al endpoint de registro', async () => {
    const fetchMock = stubFetch();
    render(<UsersManagement />);
    await screen.findByText('Ana García');

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }));
    await userEvent.type(campo('rut'), '12345');
    await userEvent.type(campo('nombre'), 'Pedro');
    await userEvent.type(campo('clave'), 'secreta');
    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }));

    expect(await screen.findByText(/RUT ingresado no es válido/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REGISTER, expect.anything());
  });

  it('crea un usuario válido: POST a register y guarda habilidades', async () => {
    const fetchMock = stubFetch();
    render(<UsersManagement />);
    await screen.findByText('Ana García');

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }));
    await userEvent.type(campo('rut'), '111111111'); // se formatea a 11.111.111-1
    await userEvent.type(campo('nombre'), 'Pedro Soto');
    await userEvent.type(campo('clave'), 'secreta');
    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }));

    expect(await screen.findByText(/creado con éxito/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH.REGISTER,
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(saveUserSkillIdsMock).toHaveBeenCalledWith(5, []));
  });

  it('al editar precarga el usuario y hace PUT al endpoint con su id', async () => {
    const fetchMock = stubFetch();
    render(<UsersManagement />);
    await screen.findByText('Ana García');

    // Editar la primera fila (Ana, id 2 tras el orden alfabético)
    await userEvent.click(screen.getAllByTitle('Editar')[0]);
    expect(await screen.findByText('Editar Usuario')).toBeInTheDocument();
    expect(campo('rut').value).toBe('22.222.222-2');

    await userEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AUTH.USERS}/2`,
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('elimina un usuario tras confirmar en el modal', async () => {
    const fetchMock = stubFetch();
    render(<UsersManagement />);
    await screen.findByText('Ana García');

    await userEvent.click(screen.getAllByTitle('Eliminar')[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Confirmar Eliminación/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AUTH.USERS}/2`,
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });
});
