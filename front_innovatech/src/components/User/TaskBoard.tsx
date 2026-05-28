import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from 'react-bootstrap';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import API_BASE_URL, { API_ENDPOINTS } from '../../config/api';
import './TaskBoard.css';

interface Tarea {
  id: number;
  proyectoId?: number;
  titulo: string;
  descripcion: string;
  estado: 'POR_HACER' | 'EN_PROGRESO' | 'COMPLETADO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  asignadoId?: number;
  asignadoNombre?: string;
  fechaLimite?: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  estado: string;
}

interface UsuarioActual {
  id: number;
  nombre: string;
}

const PRIORIDAD_CONFIG = {
  ALTA:  { label: 'Alta',  color: '#b91c1c', bg: '#fee2e2' },
  MEDIA: { label: 'Media', color: '#92400e', bg: '#fef3c7' },
  BAJA:  { label: 'Baja',  color: '#065f46', bg: '#d1fae5' },
};

const ESTADO_PROYECTO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INICIO:      { label: 'Inicio',      color: '#92400e', bg: '#fef3c7' },
  EN_PROGRESO: { label: 'En Progreso', color: '#3730a3', bg: '#ede9fe' },
  FINALIZADO:  { label: 'Finalizado',  color: '#065f46', bg: '#d1fae5' },
};

const COLUMNAS: { key: Tarea['estado']; label: string; color: string }[] = [
  { key: 'POR_HACER',   label: 'Por Hacer',   color: '#64748b' },
  { key: 'EN_PROGRESO', label: 'En Progreso', color: '#6366f1' },
  { key: 'COMPLETADO',  label: 'Completado',  color: '#10b981' },
];

function getInitials(nombre: string) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

interface TareaCardProps {
  tarea: Tarea;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
}

const TareaCard: React.FC<TareaCardProps> = ({ tarea, isDragging, onDragStart, onDragEnd }) => {
  const p = PRIORIDAD_CONFIG[tarea.prioridad];
  return (
    <div
      className={`tb-task-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={e => onDragStart(e, tarea.id)}
      onDragEnd={onDragEnd}
    >
      <div className="tb-task-header">
        <Badge className="tb-prioridad-badge" style={{ backgroundColor: p.bg, color: p.color }}>
          {p.label}
        </Badge>
        <div className="tb-drag-handle" title="Arrastrar">
          <span /><span /><span />
        </div>
      </div>
      <p className="tb-task-title">{tarea.titulo}</p>
      <p className="tb-task-desc">{tarea.descripcion}</p>
      <div className="tb-task-footer">
        {tarea.asignadoNombre && (
          <div className="tb-asignado">
            <div className="tb-asignado-avatar">{getInitials(tarea.asignadoNombre)}</div>
            <span className="tb-asignado-nombre">{tarea.asignadoNombre}</span>
          </div>
        )}
        {tarea.fechaLimite && (
          <span className="tb-fecha">
            {new Date(tarea.fechaLimite).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
};

const TaskBoard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<Tarea['estado'] | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const proyectoId = Number(id);

    Promise.all([
      fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}`, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => ({ id: proyectoId, nombre: `Proyecto ${proyectoId}`, estado: 'EN_PROGRESO' })),
      fetch(`${API_BASE_URL}/api/proyectos/${proyectoId}/tareas`, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => [] as Tarea[]),
      fetch(API_ENDPOINTS.AUTH.ME, { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .catch(() => null),
    ]).then(([pData, tData, meData]) => {
      setProyecto(pData);
      setTareas(tData);
      if (meData) setUsuarioActual({ id: meData.id, nombre: meData.nombre });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDragStart = (e: React.DragEvent, tareaId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('tareaId', String(tareaId));
    setTimeout(() => setDraggedId(tareaId), 0);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverCol(null);
    dragCounter.current = {};
  };

  const handleColDragEnter = (e: React.DragEvent, colKey: Tarea['estado']) => {
    e.preventDefault();
    dragCounter.current[colKey] = (dragCounter.current[colKey] ?? 0) + 1;
    setOverCol(colKey);
  };

  const handleColDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColDragLeave = (_e: React.DragEvent, colKey: Tarea['estado']) => {
    dragCounter.current[colKey] = (dragCounter.current[colKey] ?? 1) - 1;
    if (dragCounter.current[colKey] <= 0) {
      dragCounter.current[colKey] = 0;
      setOverCol(prev => prev === colKey ? null : prev);
    }
  };

  const handleDrop = (e: React.DragEvent, colKey: Tarea['estado']) => {
    e.preventDefault();
    const tareaId = Number(e.dataTransfer.getData('tareaId'));
    if (!tareaId) return;

    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea || tarea.estado === colKey) return;

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const tareaActualizada = { ...tarea, estado: colKey };

    setTareas(prev => prev.map(t => t.id === tareaId ? tareaActualizada : t));
    setDraggedId(null);
    setOverCol(null);
    dragCounter.current = {};

    fetch(`${API_BASE_URL}/api/proyectos/${tarea.proyectoId ?? id}/tareas/${tareaId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(tareaActualizada),
    }).catch(() => {
      // Revertir si la API falla
      setTareas(prev => prev.map(t => t.id === tareaId ? tarea : t));
    });
  };

  // Solo mostrar las tareas asignadas al usuario actual
  const misTareas = usuarioActual
    ? tareas.filter(t => t.asignadoId === usuarioActual.id)
    : tareas;

  const tareasPorEstado = (estado: Tarea['estado']) =>
    misTareas.filter(t => t.estado === estado);

  const estadoCfg = proyecto
    ? (ESTADO_PROYECTO_CONFIG[proyecto.estado] ?? ESTADO_PROYECTO_CONFIG.INICIO)
    : null;

  return (
    <div className="task-board">
      <div className="tb-header">
        <button className="tb-back-btn" onClick={() => navigate('/user/proyectos')}>
          <ArrowLeft size={18} />
          <span>Mis Proyectos</span>
        </button>

        <div className="tb-project-info">
          <div className="tb-project-icon">
            <FolderKanban size={20} />
          </div>
          <div>
            <h1 className="tb-project-name">
              {loading ? 'Cargando...' : proyecto?.nombre ?? `Proyecto ${id}`}
            </h1>
            <p className="tb-project-sub">
              {usuarioActual ? `Mis tareas — ${usuarioActual.nombre}` : 'Tablero de tareas'}
            </p>
          </div>
        </div>

        {estadoCfg && (
          <Badge
            className="tb-proyecto-estado"
            style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.color }}
          >
            {estadoCfg.label}
          </Badge>
        )}
      </div>

      <div className="tb-board">
        {COLUMNAS.map(col => {
          const colTareas = tareasPorEstado(col.key);
          const isOver = overCol === col.key;
          return (
            <div
              key={col.key}
              className={`tb-column ${isOver ? 'drop-target' : ''}`}
              onDragEnter={e => handleColDragEnter(e, col.key)}
              onDragOver={handleColDragOver}
              onDragLeave={e => handleColDragLeave(e, col.key)}
              onDrop={e => handleDrop(e, col.key)}
            >
              <div className="tb-col-header">
                <div className="tb-col-dot" style={{ background: col.color }} />
                <span className="tb-col-title">{col.label}</span>
                <span className="tb-col-count">{colTareas.length}</span>
              </div>

              <div className="tb-col-body">
                {loading ? (
                  <div className="tb-col-empty">Cargando...</div>
                ) : colTareas.length === 0 ? (
                  <div className={`tb-col-empty ${isOver ? 'drop-hint' : ''}`}>
                    {isOver ? 'Soltar aquí' : 'Sin tareas'}
                  </div>
                ) : (
                  colTareas.map(t => (
                    <TareaCard
                      key={t.id}
                      tarea={t}
                      isDragging={draggedId === t.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
                {isOver && colTareas.length > 0 && (
                  <div className="tb-drop-zone">Soltar aquí</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
