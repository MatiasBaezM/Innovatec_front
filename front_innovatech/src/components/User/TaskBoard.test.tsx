import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskBoard from './TaskBoard';

// react-router: el tablero lee :id de la URL y navega con useNavigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => navigateMock,
}));

const proyecto = { id: 1, nombre: 'Proyecto Web', estado: 'EN_PROGRESO' };
const me = { id: 7, nombre: 'Juan Pérez' };

const tareas = [
  { id: 1, estado: 'POR_HACER', prioridad: 'ALTA', titulo: 'Mi tarea', descripcion: 'd', asignadoId: 7, asignadoNombre: 'Juan Pérez' },
  { id: 2, estado: 'EN_PROGRESO', prioridad: 'BAJA', titulo: 'Tarea ajena', descripcion: 'd', asignadoId: 99, asignadoNombre: 'Otro' },
];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

function stubFetch(tareasData: unknown[] = tareas) {
  const fn = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/auth/me')) return okJson(me);
    if (url.includes('/tareas')) {
      if (method === 'PUT') return okJson({});
      return okJson(tareasData);
    }
    if (url.includes('/api/proyectos/1')) return okJson(proyecto);
    return okJson({});
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function dataTransfer(id: string) {
  return { getData: () => id, setData: () => {}, dropEffect: '', effectAllowed: '' };
}

describe('TaskBoard (User)', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carga el proyecto y muestra las 4 columnas del tablero', async () => {
    stubFetch();
    render(<TaskBoard />);
    expect(await screen.findByText('Proyecto Web')).toBeInTheDocument();
    ['Por Hacer', 'En Progreso', 'Completado', 'Revisado'].forEach(col =>
      expect(screen.getByText(col, { selector: '.tb-col-title' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Mis tareas — Juan Pérez/)).toBeInTheDocument();
  });

  it('muestra solo las tareas asignadas al usuario actual', async () => {
    stubFetch();
    render(<TaskBoard />);
    expect(await screen.findByText('Mi tarea')).toBeInTheDocument();
    expect(screen.queryByText('Tarea ajena')).not.toBeInTheDocument();
  });

  it('mueve una tarea de columna y persiste el cambio con PUT', async () => {
    const fetchMock = stubFetch();
    render(<TaskBoard />);
    await screen.findByText('Mi tarea');

    const colEnProgreso = screen.getByText('En Progreso', { selector: '.tb-col-title' }).closest('.tb-column')!;
    fireEvent.drop(colEnProgreso, { dataTransfer: dataTransfer('1') });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/proyectos/1/tareas/1'),
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });

  it('ignora el drop sobre la columna Revisado (solo lectura)', async () => {
    const fetchMock = stubFetch();
    render(<TaskBoard />);
    await screen.findByText('Mi tarea');
    fetchMock.mockClear();

    const colRevisado = screen.getByText('Revisado').closest('.tb-column')!;
    // La columna readonly no tiene handler onDrop; disparar drop no genera PUT
    fireEvent.drop(colRevisado, { dataTransfer: dataTransfer('1') });

    await new Promise(r => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/tareas/1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('el botón volver navega a Mis Proyectos', async () => {
    stubFetch();
    render(<TaskBoard />);
    await screen.findByText('Proyecto Web');
    await userEvent.click(screen.getByRole('button', { name: /Mis Proyectos/i }));
    expect(navigateMock).toHaveBeenCalledWith('/user/proyectos');
  });
});
