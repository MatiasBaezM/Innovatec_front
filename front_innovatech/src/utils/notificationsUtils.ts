/**
 * Notificaciones para el administrador.
 *
 * El backend no expone (todavía) un endpoint de notificaciones, por lo que se
 * persisten en localStorage. Esto permite que el gestor genere un aviso al
 * finalizar un proyecto y que el administrador lo vea en la campana del topbar.
 * Cuando exista un endpoint dedicado, basta con reemplazar las funciones de
 * carga/guardado por llamadas a la API.
 */

const STORAGE_KEY = 'innovatech_admin_notifs';

export interface Notificacion {
  id: number;
  titulo: string;
  fecha: string;       // ISO
  leida: boolean;
}

export function loadNotificaciones(): Notificacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveNotificaciones(notifs: Notificacion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

/** Agrega una notificación nueva (no leída) al inicio de la lista. */
export function pushNotificacion(titulo: string): Notificacion {
  const notif: Notificacion = {
    id: Date.now(),
    titulo,
    fecha: new Date().toISOString(),
    leida: false,
  };
  const notifs = [notif, ...loadNotificaciones()].slice(0, 50);
  saveNotificaciones(notifs);
  return notif;
}

/** Marca todas las notificaciones como leídas. */
export function marcarTodasLeidas(): Notificacion[] {
  const notifs = loadNotificaciones().map(n => ({ ...n, leida: true }));
  saveNotificaciones(notifs);
  return notifs;
}

export function contarNoLeidas(notifs: Notificacion[]): number {
  return notifs.filter(n => !n.leida).length;
}
