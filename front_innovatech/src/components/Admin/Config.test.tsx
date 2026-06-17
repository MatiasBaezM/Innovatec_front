import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Config from './Config';
import { API_ENDPOINTS } from '../../config/api';

let skills = [{ id: 1, nombre: 'React', color: '#6366f1' }];
const createSkillMock = vi.fn((..._a: unknown[]) => Promise.resolve({ id: 2, nombre: 'Node', color: '#ef4444' }));
const deleteSkillMock = vi.fn((..._a: unknown[]) => Promise.resolve(true));
vi.mock('../../utils/skillsUtils', () => ({
  COLORES_SKILLS: ['#6366f1', '#ef4444', '#10b981'],
  fetchSkills: () => Promise.resolve(skills),
  createSkill: (...a: unknown[]) => createSkillMock(...a),
  updateSkill: vi.fn(() => Promise.resolve({ id: 1, nombre: 'React', color: '#6366f1' })),
  deleteSkill: (...a: unknown[]) => deleteSkillMock(...a),
}));

const perfil = { id: 1, nombre: 'Admin Innovatech', correo: 'a@x.cl', rut: '11.111.111-1', rol: 'ADMINISTRADOR' };
const actividades = [{ id: 1, titulo: 'Inicio de sesión', fechaCreacion: '2026-06-01T10:00:00Z' }];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

function stubFetch() {
  const fn = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/auth/me')) return okJson(perfil);
    if (url.includes('/actividades')) return okJson(actividades);
    if (url.includes('/auth/users')) return okJson(method === 'PUT' ? {} : []);
    return okJson({});
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('Config', () => {
  beforeEach(() => {
    localStorage.clear();
    skills = [{ id: 1, nombre: 'React', color: '#6366f1' }];
    createSkillMock.mockClear();
    deleteSkillMock.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga el perfil, las habilidades y la actividad', async () => {
    stubFetch();
    render(<Config />);
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    await waitFor(() =>
      expect((document.querySelector('[name="nombre"]') as HTMLInputElement).value).toBe('Admin Innovatech'),
    );
    expect(await screen.findByText('React')).toBeInTheDocument();
    expect(screen.getByText('Inicio de sesión')).toBeInTheDocument();
  });

  it('guarda los cambios del perfil con PUT', async () => {
    const fetchMock = stubFetch();
    render(<Config />);
    await waitFor(() =>
      expect((document.querySelector('[name="nombre"]') as HTMLInputElement).value).toBe('Admin Innovatech'),
    );
    await userEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    expect(await screen.findByText(/Perfil actualizado correctamente/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_ENDPOINTS.AUTH.USERS}/1`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('crea una nueva habilidad', async () => {
    stubFetch();
    render(<Config />);
    await screen.findByText('React');

    await userEvent.click(screen.getByRole('button', { name: /Nueva Habilidad/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Node');
    skills = [...skills, { id: 2, nombre: 'Node', color: '#ef4444' }];
    await userEvent.click(within(dialog).getByRole('button', { name: /Crear Habilidad/i }));

    expect(await screen.findByText(/Habilidad creada correctamente/i)).toBeInTheDocument();
    expect(createSkillMock).toHaveBeenCalled();
  });

  it('elimina una habilidad tras confirmar', async () => {
    stubFetch();
    render(<Config />);
    await screen.findByText('React');

    await userEvent.click(screen.getByTitle('Eliminar'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Eliminar Habilidad/i)).toBeInTheDocument();
    skills = [];
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deleteSkillMock).toHaveBeenCalledWith(1));
  });

  it('exporta los usuarios a CSV', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    stubFetch();
    render(<Config />);
    await screen.findByText('React');

    await userEvent.click(screen.getAllByRole('button', { name: /Excel/i })[0]);
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
  });
});
