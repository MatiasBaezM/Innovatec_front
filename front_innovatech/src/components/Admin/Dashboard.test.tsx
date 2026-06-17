import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';

const resumen = {
  totalProyectos: 10, proyectosActivos: 6, totalTrabajadores: 8,
  tareasPendientes: 5, tareasCompletadas: 12, presupuestoTotal: 1_000_000,
};
const proyectosEstado = [{ label: 'EN_PROGRESO', cantidad: 6 }, { label: 'FINALIZADO', cantidad: 4 }];
const prioridad = [{ label: 'ALTA', cantidad: 3 }];
const estado = [{ label: 'POR_HACER', cantidad: 2 }, { label: 'COMPLETADO', cantidad: 12 }];
const carga = [{ nombre: 'Juan Pérez', totalHoras: 40 }];
const costos = [{ proyectoId: 1, costoEstimado: 500000 }];
const proyectos = [{ id: 1, nombre: 'Plataforma Web' }];
const actividades = [{ id: 1, titulo: 'Proyecto creado', fechaCreacion: '2026-06-01T10:00:00Z' }];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}
const notOk = () => Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as Response);

function stubFetch(full = true) {
  const fn = vi.fn((url: string) => {
    if (!full) return notOk();
    if (url.includes('/analiticas/resumen')) return okJson(resumen);
    if (url.includes('/analiticas/proyectos')) return okJson(proyectosEstado);
    if (url.includes('/analiticas/tareas/prioridad')) return okJson(prioridad);
    if (url.includes('/analiticas/tareas/estado')) return okJson(estado);
    if (url.includes('/analiticas/carga-trabajo')) return okJson(carga);
    if (url.includes('/analiticas/costos')) return okJson(costos);
    if (url.includes('/actividades')) return okJson(actividades);
    if (url.includes('/api/proyectos')) return okJson(proyectos);
    return okJson(null);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('Dashboard (Admin)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('renderiza el título y los KPIs con los datos del resumen', async () => {
    stubFetch();
    render(<Dashboard />);
    expect(screen.getByText('Panel de Control')).toBeInTheDocument();
    expect(await screen.findByText(/de 10 totales/)).toBeInTheDocument();
    expect(screen.getByText(/12 completadas/)).toBeInTheDocument();
    expect(screen.getByText('Carga de Trabajo — Top 5')).toBeInTheDocument();
  });

  it('muestra la actividad reciente cargada', async () => {
    stubFetch();
    render(<Dashboard />);
    expect(await screen.findByText('Proyecto creado')).toBeInTheDocument();
  });

  it('muestra estados vacíos y deshabilita Exportar cuando no hay datos', async () => {
    stubFetch(false);
    render(<Dashboard />);
    expect(await screen.findAllByText(/Sin datos disponibles/)).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeDisabled();
  });

  it('exporta un CSV al hacer click en Exportar', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    stubFetch();
    render(<Dashboard />);

    const btn = await screen.findByRole('button', { name: /Exportar CSV/i });
    await waitFor(() => expect(btn).toBeEnabled());
    await userEvent.click(btn);

    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
