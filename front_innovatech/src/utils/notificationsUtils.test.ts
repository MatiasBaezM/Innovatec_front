import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadNotificaciones,
  pushNotificacion,
  marcarTodasLeidas,
  contarNoLeidas,
  type Notificacion,
} from './notificationsUtils';

describe('notificationsUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadNotificaciones', () => {
    it('devuelve un arreglo vacío cuando no hay nada guardado', () => {
      expect(loadNotificaciones()).toEqual([]);
    });

    it('devuelve un arreglo vacío si el contenido está corrupto', () => {
      localStorage.setItem('innovatech_admin_notifs', '{no es json válido');
      expect(loadNotificaciones()).toEqual([]);
    });

    it('devuelve un arreglo vacío si el JSON no es un arreglo', () => {
      localStorage.setItem('innovatech_admin_notifs', '{"foo":"bar"}');
      expect(loadNotificaciones()).toEqual([]);
    });
  });

  describe('pushNotificacion', () => {
    it('agrega una notificación no leída y la persiste', () => {
      const notif = pushNotificacion('Proyecto finalizado');
      expect(notif.titulo).toBe('Proyecto finalizado');
      expect(notif.leida).toBe(false);

      const persistidas = loadNotificaciones();
      expect(persistidas).toHaveLength(1);
      expect(persistidas[0].titulo).toBe('Proyecto finalizado');
    });

    it('agrega las notificaciones nuevas al inicio de la lista', () => {
      pushNotificacion('Primera');
      pushNotificacion('Segunda');
      const lista = loadNotificaciones();
      expect(lista[0].titulo).toBe('Segunda');
      expect(lista[1].titulo).toBe('Primera');
    });

    it('limita la lista a 50 notificaciones', () => {
      for (let i = 0; i < 55; i++) pushNotificacion(`N${i}`);
      expect(loadNotificaciones()).toHaveLength(50);
    });
  });

  describe('marcarTodasLeidas', () => {
    it('marca todas las notificaciones como leídas', () => {
      pushNotificacion('Una');
      pushNotificacion('Dos');
      const resultado = marcarTodasLeidas();
      expect(resultado.every(n => n.leida)).toBe(true);
      expect(loadNotificaciones().every(n => n.leida)).toBe(true);
    });
  });

  describe('contarNoLeidas', () => {
    it('cuenta solo las notificaciones no leídas', () => {
      const notifs: Notificacion[] = [
        { id: 1, titulo: 'a', fecha: '', leida: false },
        { id: 2, titulo: 'b', fecha: '', leida: true },
        { id: 3, titulo: 'c', fecha: '', leida: false },
      ];
      expect(contarNoLeidas(notifs)).toBe(2);
    });

    it('devuelve 0 cuando todas están leídas', () => {
      expect(contarNoLeidas([{ id: 1, titulo: 'a', fecha: '', leida: true }])).toBe(0);
    });
  });
});
