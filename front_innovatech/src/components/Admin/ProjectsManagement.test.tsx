import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsManagement from './ProjectsManagement';
import { API_ENDPOINTS } from '../../config/api';

const proyectos = [
  { id: 1, nombre: 'Plataforma Web', descripcion: 'Portal central', estado: 'EN_PROGRESO', fechaInicio: '2026-05-01', fechaTermino: '2026-09-30' },
  { id: 2, nombre: 'App Móvil', descripcion: 'Seguimiento', estado: 'INICIO', fechaInicio: '2026-06-15', fechaTermino: '2026-12-15' },
];

const usuarios = [
  { id: 1, nombre: 'Juan Pérez', rol: 'COLABORADOR' },
  { id: 10, nombre: 'Gestora Ana', rol: 'GESTOR_PROYECTOS' },
];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

/** Router de fetch: BASE GET lista proyectos, USERS lista usuarios, equipo PUT devuelve proyecto. */
function stubFetch(opts: { projectsOk?: boolean } = {}) {
  const { projectsOk = true } = opts;
  const fn = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/api/proyectos/actividades')) return okJson({});
    if (url.includes('/equipo')) {
      return okJson({ ...proyectos[0], gestorId: 10, gestorNombre: 'Gestora Ana', colaboradores: [] });
    }
    if (url.includes('/api/proyectos')) {
      if (method === 'GET') {
        return projectsOk
          ? okJson(proyectos)
          : Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as Response);
      }
      return okJson({ id: 99 });
    }
    if (url.includes('/auth/users')) return okJson(usuarios);
    return okJson({});
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function campo(name: string): HTMLInputElement {
  const el = document.querySelector(`[name="${name}"]`);
  if (!el) throw new Error(`No se encontró el campo "${name}"`);
  return el as HTMLInputElement;
}

describe('ProjectsManagement', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carga y muestra los proyectos de la API', async () => {
    stubFetch();
    render(<ProjectsManagement />);
    expect(await screen.findByText('Plataforma Web')).toBeInTheDocument();
    expect(screen.getByText('App Móvil')).toBeInTheDocument();
    // El estado se muestra como badge
    expect(screen.getByText('EN_PROGRESO')).toBeInTheDocument();
  });

  it('usa proyectos de respaldo cuando la API responde con error', async () => {
    stubFetch({ projectsOk: false });
    render(<ProjectsManagement />);
    expect(await screen.findByText('Sistema Innovatech')).toBeInTheDocument();
  });

  it('abre el modal de nuevo proyecto', async () => {
    stubFetch();
    render(<ProjectsManagement />);
    await screen.findByText('Plataforma Web');

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Nuevo Proyecto')).toBeInTheDocument();
    expect(within(dialog).getByText('Nombre del Proyecto')).toBeInTheDocument();
  });

  it('crea un proyecto válido con POST al endpoint base', async () => {
    const fetchMock = stubFetch();
    render(<ProjectsManagement />);
    await screen.findByText('Plataforma Web');

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    await userEvent.type(campo('nombre'), 'Proyecto Nuevo');
    await userEvent.type(campo('descripcion'), 'Una descripción');
    // Las fechas se setean directamente (inputs date)
    fireEvent.change(campo('fechaTermino'), { target: { value: '2030-01-01' } });
    await userEvent.click(screen.getByRole('button', { name: /Crear Proyecto/i }));

    expect(await screen.findByText(/creado con éxito/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      API_ENDPOINTS.PROJECTS.BASE,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('valida que la fecha de término no sea anterior a la de inicio', async () => {
    stubFetch();
    render(<ProjectsManagement />);
    await screen.findByText('Plataforma Web');

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    await userEvent.type(campo('nombre'), 'Proyecto X');
    await userEvent.type(campo('descripcion'), 'desc');
    // Inicio en el futuro, término anterior al inicio
    fireEvent.change(campo('fechaInicio'), { target: { value: '2030-06-10' } });
    fireEvent.change(campo('fechaTermino'), { target: { value: '2030-06-01' } });
    // El submit JS valida el orden de fechas
    fireEvent.submit(campo('nombre').closest('form')!);

    expect(await screen.findByText(/no puede ser anterior a la fecha de inicio/i)).toBeInTheDocument();
  });

  it('elimina un proyecto tras confirmar', async () => {
    const fetchMock = stubFetch();
    render(<ProjectsManagement />);
    await screen.findByText('Plataforma Web');

    await userEvent.click(screen.getAllByTitle('Eliminar')[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Confirmar Eliminación/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_ENDPOINTS.PROJECTS.BASE}/1`,
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('asigna un gestor al equipo y guarda el equipo del proyecto', async () => {
    const fetchMock = stubFetch();
    render(<ProjectsManagement />);
    await screen.findByText('Plataforma Web');

    await userEvent.click(screen.getAllByTitle('Gestionar Equipo')[0]);
    // Espera a que carguen los gestores en el primer combobox
    await waitFor(() => expect(screen.getByText('Gestora Ana')).toBeInTheDocument());

    const dialog = screen.getByRole('dialog');
    const gestorSelect = within(dialog).getAllByRole('combobox')[0];
    await userEvent.selectOptions(gestorSelect, '10');

    await userEvent.click(within(dialog).getByRole('button', { name: /Guardar Equipo/i }));

    expect(await screen.findByText(/Equipo guardado correctamente/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_ENDPOINTS.PROJECTS.BASE}/1/equipo`,
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('permite agregar y quitar un colaborador de la lista del equipo', async () => {
    stubFetch();
    render(<ProjectsManagement />);
    await screen.findByText('Plataforma Web');

    await userEvent.click(screen.getAllByTitle('Gestionar Equipo')[0]);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    const dialog = screen.getByRole('dialog');
    // Segundo combobox = selector de colaboradores
    const colabSelect = within(dialog).getAllByRole('combobox')[1];
    await userEvent.selectOptions(colabSelect, '1');

    // El botón "+" de agregar es el hermano inmediato del selector de colaboradores
    const agregar = colabSelect.parentElement!.querySelector('button') as HTMLButtonElement;
    await userEvent.click(agregar);

    // Aparece en "Colaboradores Asignados (1)"
    expect(await within(dialog).findByText(/Colaboradores Asignados \(1\)/i)).toBeInTheDocument();

    // Quitarlo con el botón de remover (título "Remover")
    await userEvent.click(within(dialog).getByTitle('Remover'));
    expect(await within(dialog).findByText(/Colaboradores Asignados \(0\)/i)).toBeInTheDocument();
  });
});
