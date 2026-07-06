import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { BarChart2 } from 'lucide-react';
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

// ── Componente ───────────────────────────────────────────────────
const GanttChart: React.FC<Props> = ({ proyectoId, nombreProyecto }) => {
  const [data, setData] = useState<GanttProyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (data.tareas.length === 0) {
    return (
      <div className="gantt-wrapper">
        <div className="gantt-title">
          <BarChart2 size={18} color="#8b5cf6" />
          Carta Gantt — {data.nombreProyecto}
        </div>
        <div className="gantt-empty">
          No hay tareas con fechas definidas. Asigna una fecha de inicio y término
          al crear las tareas para verlas aquí.
        </div>
      </div>
    );
  }

  // ── Calcular rango de fechas del eje X ─────────────────────────
  // Si el proyecto tiene fechas, usarlas; si no, calcular desde las tareas.
  const fechaInicioProy = data.fechaInicioProyecto
    ? parseFecha(data.fechaInicioProyecto)
    : parseFecha(
        data.tareas.reduce((min, t) => (t.fechaInicio < min ? t.fechaInicio : min),
          data.tareas[0].fechaInicio)
      );

  const fechaFinProy = data.fechaFinProyecto
    ? parseFecha(data.fechaFinProyecto)
    : parseFecha(
        data.tareas.reduce((max, t) => (t.fechaFin > max ? t.fechaFin : max),
          data.tareas[0].fechaFin)
      );

  const totalDias = diasEntre(fechaInicioProy, fechaFinProy);
  const dias = generarDias(fechaInicioProy, fechaFinProy);

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
      </div>

      <div className="gantt-table-wrapper">
        {/* Header: nombres de días */}
        <div className="gantt-header-row">
          <div className="gantt-label-col">Tarea</div>
          <div className="gantt-day-headers">
            {dias.map((d, i) => (
              <div
                key={i}
                className={`gantt-day-header${esFinDeSemana(d) ? ' weekend' : ''}`}
                title={d.toLocaleDateString('es-CL')}
              >
                {d.getDate()}
              </div>
            ))}
          </div>
        </div>

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
                  className={`gantt-cell${esFinDeSemana(d) ? ' weekend' : ''}`}
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
  );
};

export default GanttChart;
