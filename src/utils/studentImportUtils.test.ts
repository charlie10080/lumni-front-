import { describe, expect, it } from 'vitest';
import { calculateCurp, cleanText, generateNextMatricula } from './studentImportUtils';
import type { Student } from '../types';

describe('cleanText', () => {
  it('quita acentos, pasa a mayúsculas y recorta', () => {
    expect(cleanText('  José Ángel ')).toBe('JOSE ANGEL');
    expect(cleanText('')).toBe('');
  });
});

describe('calculateCurp', () => {
  it('genera una CURP de 18 caracteres con la base oficial', () => {
    const { base11, fullCurp } = calculateCurp('Juan', 'Pérez', 'López', '2014-05-18', 'M');
    expect(base11).toHaveLength(11);
    expect(base11.startsWith('PELJ140518')).toBe(true);
    expect(fullCurp).toHaveLength(18);
  });
});

describe('generateNextMatricula', () => {
  it('empieza en 001 sin alumnos', () => {
    expect(generateNextMatricula([], '2026')).toBe('LUM-2026-001');
  });
  it('continúa tras la matrícula más alta y respeta el offset', () => {
    const existing = [{ matricula: 'LUM-2026-004' }, { matricula: 'LUM-2026-002' }] as Student[];
    expect(generateNextMatricula(existing, '2026')).toBe('LUM-2026-005');
    expect(generateNextMatricula(existing, '2026', 2)).toBe('LUM-2026-007');
  });
});
