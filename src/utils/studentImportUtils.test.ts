import { describe, expect, it } from 'vitest';
import { calculateCurp, cleanText, generateNextMatricula, splitFullNameSurnamesFirst } from './studentImportUtils';
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

describe('splitFullNameSurnamesFirst', () => {
  it('separa dos apellidos y nombres compuestos', () => {
    expect(splitFullNameSurnamesFirst('BRAVO JIMENEZ SAMUEL VLADIMIR')).toEqual({
      primerApellido: 'BRAVO',
      segundoApellido: 'JIMENEZ',
      nombre: 'SAMUEL VLADIMIR',
    });
    expect(splitFullNameSurnamesFirst('CORREA SAUCEDO LEO')).toEqual({ primerApellido: 'CORREA', segundoApellido: 'SAUCEDO', nombre: 'LEO' });
  });
  it('respeta apellidos con partículas', () => {
    expect(splitFullNameSurnamesFirst('DE LA CRUZ DEL VALLE ANA SOFIA')).toEqual({
      primerApellido: 'DE LA CRUZ',
      segundoApellido: 'DEL VALLE',
      nombre: 'ANA SOFIA',
    });
  });
  it('con dos palabras toma un apellido y un nombre', () => {
    expect(splitFullNameSurnamesFirst('GARCIA LUIS')).toEqual({ primerApellido: 'GARCIA', segundoApellido: '', nombre: 'LUIS' });
    expect(splitFullNameSurnamesFirst('LUIS')).toBeNull();
  });
});
