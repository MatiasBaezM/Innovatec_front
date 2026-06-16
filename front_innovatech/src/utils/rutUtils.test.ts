import { describe, it, expect } from 'vitest';
import { formatRut, validateRut } from './rutUtils';

describe('formatRut', () => {
  it('devuelve cadena vacía cuando no hay caracteres válidos', () => {
    expect(formatRut('')).toBe('');
    expect(formatRut('---..')).toBe('');
  });

  it('formatea un RUT con puntos y guion', () => {
    expect(formatRut('12345678K')).toBe('12.345.678-K');
  });

  it('limpia caracteres no válidos antes de formatear', () => {
    expect(formatRut('12.345.678-5')).toBe('12.345.678-5');
  });

  it('pasa la K a mayúscula', () => {
    expect(formatRut('11111111k')).toBe('11.111.111-K');
  });

  it('mantiene un solo carácter sin guion', () => {
    expect(formatRut('5')).toBe('5');
  });
});

describe('validateRut', () => {
  it('valida un RUT correcto', () => {
    // 11.111.111-1 es un RUT con DV válido
    expect(validateRut('11.111.111-1')).toBe(true);
  });

  it('rechaza un RUT con dígito verificador incorrecto', () => {
    expect(validateRut('11.111.111-2')).toBe(false);
  });

  it('rechaza cadenas demasiado cortas', () => {
    expect(validateRut('5')).toBe(false);
    expect(validateRut('')).toBe(false);
  });

  it('acepta DV "K" cuando corresponde', () => {
    // El cuerpo 1000005 tiene dígito verificador K
    expect(validateRut('1.000.005-K')).toBe(true);
  });

  it('valida ignorando el formato de entrada', () => {
    expect(validateRut('11111111-1')).toBe(true);
    expect(validateRut('11.111.111-1')).toBe(true);
  });
});
