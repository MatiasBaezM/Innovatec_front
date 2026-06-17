import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GestorTaskBoard from './GestorTaskBoard';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => navigateMock,
}));

// Aislamos la notificación al admin (escribe en localStorage)
const pushNotificacionMock = vi.fn();
vi.mock('../../utils/notificationsUtils', () => ({
  pushNotificacion: (...a: unknown[]) => pushNotificacionMock(...a),
}));

const proyecto = { id: 1, nombre: 'Proyecto Web', estado: 'EN_PROGRESO' };
const colaboradores = [
  { id: 1, nombre: 'Juan Pérez', rol: 'COLABORADOR' },
  { id: 2, nombre: 'María Silva', rol: 'COLABORADOR' },
  { id: 9, nombre: 'Admin', rol: 'ADMINISTRADOR' },
];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

function stubFetch(tareasData: unknown[]) {
  const fn = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/auth/users')) return okJson(colaboradores);
    if (url.includes('/actividades')) return okJson({});
    if (url.includes('/tareas')) {
      if (method === 'POST') return okJson({ id: 555, estado: 'POR_HACER', prioridad: 'MEDIA', titulo: 'Nueva', descripcion: 'x', asignadoNombre: 'Juan Pérez' });
      return method === 'GET' ? okJson(tareasData) : okJson({});
    }
    if (url.includes('/api/proyectos/1')) return okJson(proyecto);
    return okJson({});
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('GestorTaskBoard', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    pushNotificacionMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra todas las tareas del equipo (sin filtrar por usuario)', async () => {
    stubFetch([
      { id: 1, estado: 'POR_HACER', prioridad: 'ALTA', titulo: 'Tarea A', descripcion: 'd', asignadoId: 1, asignadoNombre: 'Juan' },
      { id: 2, estado: 'EN_PROGRESO', prioridad: 'BAJA', titulo: 'Tarea B', descripcion: 'd', asignadoId: 2, asignadoNombre: 'María' },
    ]);
    render(<GestorTaskBoard />);
    expect(await screen.findByText('Proyecto Web')).toBeInTheDocument();
    expect(screen.getByText('Tarea A')).toBeInTheDocument();
    expect(screen.getByText('Tarea B')).toBeInTheDocument();
    expect(screen.getByText(/Todas las tareas del equipo/)).toBeInTheDocument();
  });

  it('crea una tarea válida con POST e informa la asignación', async () => {
    const fetchMock = stubFetch([]);
    render(<GestorTaskBoard />);
    await screen.findByText('Proyecto Web');

    await userEvent.click(screen.getByRole('button', { name: /Nueva Tarea/i }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.type(dialog.querySelector('[name="titulo"]')!, 'Diseñar login');
    fireEvent.change(dialog.querySelector('[name="descripcion"]')!, { target: { value: 'Detalle' } });
    fireEvent.change(dialog.querySelector('[name="fechaLimite"]')!, { target: { value: '2030-01-01' } });
    fireEvent.change(dialog.querySelector('[name="horasEstimadas"]')!, { target: { value: '8' } });
    await userEvent.selectOptions(dialog.querySelector('[name="asignadoId"]')!, '1');

    await userEvent.click(within(dialog).getByRole('button', { name: /Crear y Asignar Tarea/i }));

    expect(await screen.findByText(/Tarea asignada a Juan Pérez/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/proyectos/1/tareas'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('exige seleccionar un colaborador (no hay opción vacía válida)', async () => {
    stubFetch([]);
    render(<GestorTaskBoard />);
    await screen.findByText('Proyecto Web');
    await userEvent.click(screen.getByRole('button', { name: /Nueva Tarea/i }));
    const dialog = await screen.findByRole('dialog');
    // El select de colaborador arranca vacío y es obligatorio
    expect((dialog.querySelector('[name="asignadoId"]') as HTMLSelectElement).value).toBe('');
  });

  it('aprobar una tarea COMPLETADO la marca como revisada (PUT)', async () => {
    const fetchMock = stubFetch([
      { id: 5, estado: 'COMPLETADO', prioridad: 'MEDIA', titulo: 'Para revisar', descripcion: 'd', asignadoId: 1, asignadoNombre: 'Juan' },
    ]);
    render(<GestorTaskBoard />);
    await screen.findByText('Para revisar');

    await userEvent.click(screen.getByRole('button', { name: /Aprobar/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tareas/5'),
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('rechazar una tarea abre el modal y la devuelve con mensaje de corrección', async () => {
    const fetchMock = stubFetch([
      { id: 5, estado: 'COMPLETADO', prioridad: 'MEDIA', titulo: 'Para revisar', descripcion: 'd', asignadoId: 1, asignadoNombre: 'Juan' },
    ]);
    render(<GestorTaskBoard />);
    await screen.findByText('Para revisar');

    await userEvent.click(screen.getByRole('button', { name: /Rechazar/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Faltan validaciones');
    await userEvent.click(within(dialog).getByRole('button', { name: /Rechazar/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tareas/5'),
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('finaliza el proyecto cuando todas las tareas están revisadas', async () => {
    const fetchMock = stubFetch([
      { id: 5, estado: 'REVISADO', prioridad: 'MEDIA', titulo: 'Lista', descripcion: 'd', asignadoId: 1, asignadoNombre: 'Juan' },
    ]);
    render(<GestorTaskBoard />);
    await screen.findByText('Lista');

    const finalizar = screen.getByRole('button', { name: /Finalizar Proyecto/i });
    expect(finalizar).toBeEnabled();
    await userEvent.click(finalizar);

    expect(await screen.findByText(/Proyecto marcado como finalizado/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/proyectos/1'),
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(pushNotificacionMock).toHaveBeenCalled();
  });

  it('deshabilita Finalizar si hay tareas no revisadas', async () => {
    stubFetch([
      { id: 5, estado: 'EN_PROGRESO', prioridad: 'MEDIA', titulo: 'Pendiente', descripcion: 'd', asignadoId: 1, asignadoNombre: 'Juan' },
    ]);
    render(<GestorTaskBoard />);
    await screen.findByText('Pendiente');
    expect(screen.getByRole('button', { name: /Finalizar Proyecto/i })).toBeDisabled();
  });
});
