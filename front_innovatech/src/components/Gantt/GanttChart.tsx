import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { BarChart2, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import './GanttChart.css';

// ── Tipos ────────────────────────────────────────────────────────
interface GanttTarea {
  id: number;
  titulo: string;
  estado: 'POR_HACER' | 'EN_PROGRESO' | 'COMPLETADO' | 'REVISADO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  asignadoNombre: string;
  fechaInicio: string; // "YYYY-MM-DD"
  fechaFin: string;    // "YYYY-MM-DD"
  horasEstimadas: number | null;
  orden: number;
}

interface GanttProyecto {
  proyectoId: number;
  nombreProyecto: string;
  estado: string;
  fechaInicioProyecto: string | null;
  fechaFinProyecto: string | null;
  tareas: GanttTarea[];
}

interface Props {
  proyectoId: number;
  nombreProyecto?: string;
}

// ── Constantes ───────────────────────────────────────────────────
const ESTADO_LABELS: Record<string, string> = {
  POR_HACER:   'Por hacer',
  EN_PROGRESO: 'En progreso',
  COMPLETADO:  'Completado',
  REVISADO:    'Revisado',
};

const LEGEND_COLORS: Record<string, string> = {
  POR_HACER:   '#64748b',
  EN_PROGRESO: '#6366f1',
  COMPLETADO:  '#10b981',
  REVISADO:    '#8b5cf6',
};

// ── Helpers ──────────────────────────────────────────────────────
function parseFecha(s: string): Date {
  // Parsear "YYYY-MM-DD" sin problema de zona horaria
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diasEntre(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function esFinDeSemana(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

function generarDias(inicio: Date, fin: Date): Date[] {
  const dias: Date[] = [];
  const cursor = new Date(inicio);
  while (cursor <= fin) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface MesGrupo {
  nombre: string; // "Julio 2026"
  dias: number;   // cantidad de columnas de día que abarca el mes
}

// Agrupa los días consecutivos por mes para dibujar la cabecera superior:
// cada mes queda justo encima de sus días, con un ancho proporcional.
function generarMeses(dias: Date[]): MesGrupo[] {
  const meses: MesGrupo[] = [];
  for (const d of dias) {
    const nombre = `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;
    const ultimo = meses[meses.length - 1];
    if (ultimo && ultimo.nombre === nombre) {
      ultimo.dias += 1;
    } else {
      meses.push({ nombre, dias: 1 });
    }
  }
  return meses;
}

// Un día "abre" un mes (marca la separación) si es el día 1 y no es la
// primera columna del eje.
function esInicioDeMes(d: Date, indice: number): boolean {
  return indice > 0 && d.getDate() === 1;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// CSS embebido para el documento de impresión/PDF (ventana aparte, sin acceso
// al bundle de la app), reutilizando las mismas clases que GanttChart.css.
const PRINT_CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; margin: 24px; color: #1e293b; }
  .print-doc-title { font-size: 1.15rem; font-weight: 700; margin: 0 0 4px; }
  .print-doc-subtitle { font-size: 0.8rem; color: #64748b; margin: 0 0 20px; }
  .gantt-table-wrapper { min-width: 700px; position: relative; }
  .gantt-header-row { display: flex; border-bottom: 2px solid #e2e8f0; }
  .gantt-label-col { width: 200px; flex-shrink: 0; font-size: 0.75rem; font-weight: 600; color: #64748b; padding: 4px 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .gantt-month-row { display: flex; }
  .gantt-month-headers { flex: 1; display: flex; }
  .gantt-month-header { font-size: 11px; font-weight: 700; color: #475569; text-align: center; padding: 3px 0; text-transform: capitalize; white-space: nowrap; overflow: hidden; }
  .gantt-day-headers { flex: 1; display: flex; }
  .gantt-day-header { flex: 1; font-size: 10px; color: #94a3b8; text-align: center; padding: 4px 0; border-left: 1px solid #f1f5f9; }
  .gantt-day-header.weekend { background: #f8fafc; }
  .gantt-month-header.month-start, .gantt-day-header.month-start, .gantt-cell.month-start { border-left: 2px solid #cbd5e1; }
  .gantt-row { display: flex; align-items: center; height: 40px; border-bottom: 1px solid #f1f5f9; position: relative; page-break-inside: avoid; }
  .gantt-row:last-child { border-bottom: none; }
  .gantt-row-label { width: 200px; flex-shrink: 0; padding: 4px 8px; }
  .gantt-row-task-name { font-size: 0.78rem; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gantt-row-assignee { font-size: 0.68rem; color: #94a3b8; }
  .gantt-row-cells { flex: 1; display: flex; position: relative; height: 100%; align-items: center; }
  .gantt-cell { flex: 1; height: 100%; border-left: 1px solid #f1f5f9; }
  .gantt-cell.weekend { background: #f8fafc; }
  .gantt-bar { position: absolute; height: 22px; border-radius: 4px; display: flex; align-items: center; padding: 0 8px; font-size: 10px; font-weight: 500; white-space: nowrap; overflow: hidden; }
  .gantt-bar.POR_HACER { background: #64748b; color: #f1f5f9; }
  .gantt-bar.EN_PROGRESO { background: #6366f1; color: #f0f0ff; }
  .gantt-bar.COMPLETADO { background: #10b981; color: #d1fae5; }
  .gantt-bar.REVISADO { background: #8b5cf6; color: #ede9fe; }
  .gantt-today-line { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; }
  .gantt-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
  .gantt-legend-item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b; }
  .gantt-legend-dot { width: 11px; height: 11px; border-radius: 2px; flex-shrink: 0; }
  @page { size: landscape; margin: 12mm; }
`;

// ── Componente ───────────────────────────────────────────────────
const GanttChart: React.FC<Props> = ({ proyectoId, nombreProyecto }) => {
  const [data, setData] = useState<GanttProyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  function handleDownloadPdf() {
    if (!printRef.current || !data) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return; // el navegador bloqueó el popup

    const nombre = escapeHtml(data.nombreProyecto);
    const fechaGeneracion = new Date().toLocaleDateString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Carta Gantt - ${nombre}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
  <h1 class="print-doc-title">Carta Gantt — ${nombre}</h1>
  <p class="print-doc-subtitle">Generado el ${fechaGeneracion}</p>
  ${printRef.current.innerHTML}
</body>
</html>`);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    fetch(API_ENDPOINTS.GANTT.PROYECTO(proyectoId), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: GanttProyecto) => setData(d))
      .catch(() => setError('No se pudo cargar la carta Gantt.'))
      .finally(() => setLoading(false));
  }, [proyectoId]);

  // ── Estados de carga ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="gantt-wrapper">
        <div className="gantt-title">
          <BarChart2 size={18} color="#8b5cf6" />
          Carta Gantt
        </div>
        <div className="gantt-empty">
          <Spinner animation="border" size="sm" className="me-2" />
          Cargando diagrama...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="gantt-wrapper">
        <div className="gantt-title">
          <BarChart2 size={18} color="#8b5cf6" />
          Carta Gantt — {nombreProyecto}
        </div>
        <div className="gantt-empty">{error ?? 'Sin datos disponibles.'}</div>
      </div>
    );
  }

  // ── Calcular rango de fechas del eje X ─────────────────────────
  // Prioriza las fechas de entrega del proyecto (definidas por el administrador);
  // si no existen, cae al mínimo/máximo de las tareas. El calendario se dibuja
  // aunque todavía no haya tareas, para que la carta Gantt aparezca al crear
  // el proyecto con su rango inicio–término.
  const inicioStr =
    data.fechaInicioProyecto ??
    (data.tareas.length > 0
      ? data.tareas.reduce((min, t) => (t.fechaInicio < min ? t.fechaInicio : min), data.tareas[0].fechaInicio)
      : null);

  const finStr =
    data.fechaFinProyecto ??
    (data.tareas.length > 0
      ? data.tareas.reduce((max, t) => (t.fechaFin > max ? t.fechaFin : max), data.tareas[0].fechaFin)
      : null);

  // Sin fechas de proyecto ni tareas no hay eje que dibujar.
  if (!inicioStr || !finStr) {
    return (
      <div className="gantt-wrapper">
        <div className="gantt-title">
          <BarChart2 size={18} color="#8b5cf6" />
          Carta Gantt — {data.nombreProyecto}
        </div>
        <div className="gantt-empty">
          Define una fecha de inicio y de término para el proyecto para ver la carta Gantt.
        </div>
      </div>
    );
  }

  const fechaInicioProy = parseFecha(inicioStr);
  const fechaFinProy = parseFecha(finStr);

  const totalDias = diasEntre(fechaInicioProy, fechaFinProy);
  const dias = generarDias(fechaInicioProy, fechaFinProy);
  const meses = generarMeses(dias);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Posición de la línea "hoy" (solo si cae dentro del rango)
  const todayOffset =
    hoy >= fechaInicioProy && hoy <= fechaFinProy
      ? (diasEntre(fechaInicioProy, hoy) / totalDias) * 100
      : null;

  // ── Calcular posición de cada barra ──────────────────────────
  function calcBarLeft(fechaInicio: string): number {
    const d = parseFecha(fechaInicio);
    const offset = diasEntre(fechaInicioProy, d);
    return Math.max(0, (offset / totalDias) * 100);
  }

  function calcBarWidth(fechaInicio: string, fechaFin: string): number {
    const ini = parseFecha(fechaInicio);
    const fin = parseFecha(fechaFin);
    const duracion = diasEntre(ini, fin) + 1;
    return Math.max(1, (duracion / totalDias) * 100);
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="gantt-wrapper">
      <div className="gantt-title">
        <BarChart2 size={18} color="#8b5cf6" />
        Carta Gantt — {data.nombreProyecto}
        <button
          type="button"
          className="gantt-download-btn"
          onClick={handleDownloadPdf}
          title="Descargar la carta Gantt como PDF"
        >
          <Download size={14} /> Descargar PDF
        </button>
      </div>

      {/* Rango de entrega del proyecto: fecha de inicio y de término */}
      <div className="gantt-range">
        <span className="gantt-range-item">
          <span className="gantt-range-label">Inicio</span>
          {fechaInicioProy.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
        <span className="gantt-range-arrow">→</span>
        <span className="gantt-range-item">
          <span className="gantt-range-label">Término</span>
          {fechaFinProy.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div ref={printRef}>
        <div className="gantt-table-wrapper">
          {/* Header fila 1: meses, justo encima de sus días */}
          <div className="gantt-month-row">
            <div className="gantt-label-col gantt-month-spacer" />
            <div className="gantt-month-headers">
              {meses.map((m, i) => (
                <div
                  key={i}
                  className={`gantt-month-header${i > 0 ? ' month-start' : ''}`}
                  style={{ flexGrow: m.dias, flexBasis: 0 }}
                  title={m.nombre}
                >
                  {m.nombre}
                </div>
              ))}
            </div>
          </div>

          {/* Header fila 2: número de día */}
          <div className="gantt-header-row">
            <div className="gantt-label-col">Tarea</div>
            <div className="gantt-day-headers">
              {dias.map((d, i) => (
                <div
                  key={i}
                  className={`gantt-day-header${esFinDeSemana(d) ? ' weekend' : ''}${esInicioDeMes(d, i) ? ' month-start' : ''}`}
                  title={d.toLocaleDateString('es-CL')}
                >
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>

          {/* Aviso cuando el calendario existe pero aún no hay tareas */}
          {data.tareas.length === 0 && (
            <div className="gantt-no-tasks">
              Aún no hay tareas con fechas. El calendario muestra el rango de entrega del
              proyecto; las barras aparecerán al asignar fechas a las tareas.
            </div>
          )}

          {/* Filas de tareas */}
          {data.tareas.map(tarea => (
            <div key={tarea.id} className="gantt-row">
              {/* Columna de nombre */}
              <div className="gantt-row-label">
                <div className="gantt-row-task-name" title={tarea.titulo}>
                  {tarea.titulo}
                </div>
                <div className="gantt-row-assignee">{tarea.asignadoNombre}</div>
              </div>

              {/* Celdas del calendario + barra */}
              <div className="gantt-row-cells">
                {/* Celdas de fondo (para columnas de días) */}
                {dias.map((d, i) => (
                  <div
                    key={i}
                    className={`gantt-cell${esFinDeSemana(d) ? ' weekend' : ''}${esInicioDeMes(d, i) ? ' month-start' : ''}`}
                  />
                ))}

                {/* Barra de la tarea */}
                <div
                  className={`gantt-bar ${tarea.estado}`}
                  style={{
                    left: `${calcBarLeft(tarea.fechaInicio)}%`,
                    width: `${calcBarWidth(tarea.fechaInicio, tarea.fechaFin)}%`,
                  }}
                  title={`${tarea.titulo} — ${ESTADO_LABELS[tarea.estado]} — ${tarea.fechaInicio} / ${tarea.fechaFin}`}
                >
                  {tarea.titulo}
                </div>

                {/* Línea de hoy */}
                {todayOffset !== null && (
                  <div
                    className="gantt-today-line"
                    style={{ left: `${todayOffset}%` }}
                    title="Hoy"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="gantt-legend">
          {Object.entries(LEGEND_COLORS).map(([estado, color]) => (
            <div key={estado} className="gantt-legend-item">
              <div className="gantt-legend-dot" style={{ background: color }} />
              <span>{ESTADO_LABELS[estado]}</span>
            </div>
          ))}
          <div className="gantt-legend-item">
            <div className="gantt-legend-dot" style={{ background: '#ef4444', width: 3, borderRadius: 1 }} />
            <span>Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
