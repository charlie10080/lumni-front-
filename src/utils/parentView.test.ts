import { describe, expect, it } from 'vitest';
import { buildParentView, generateAccessCode, legacyParentKeys, parentViewFingerprint } from './parentView';
import type { Student } from '../types';

const student = (id: string, extra: Partial<Student> = {}) =>
  ({ id, curp: `CURP${id}`, matricula: `LUM-2026-00${id}`, nombre: `N${id}`, ...extra }) as Student;

describe('legacyParentKeys', () => {
  it('devuelve CURP y matrícula en mayúsculas, sin el código ni repetidos', () => {
    expect(legacyParentKeys(student('1', { codigoAcceso: 'abc234', curp: 'x1' }))).toEqual(['X1', 'LUM-2026-001']);
    expect(legacyParentKeys(student('2', { curp: 'same', matricula: 'SAME' }))).toEqual(['SAME']);
    expect(legacyParentKeys(student('3', { codigoAcceso: 'x1', curp: 'X1', matricula: '' }))).toEqual([]);
  });
});

describe('parentViewFingerprint', () => {
  const classroom = {
    subjects: [], notices: [], projects: [], tasks: [], calendarEvents: [], threads: [], incidentReports: [],
    schoolInfo: {} as never,
  };
  it('no cambia con la fecha de actualización pero sí con los datos', () => {
    const a = buildParentView('t', student('1'), classroom);
    const b = { ...buildParentView('t', student('1'), classroom), updatedAt: 'otra' };
    const c = buildParentView('t', student('1', { nombre: 'Otro' }), classroom);
    expect(parentViewFingerprint(a)).toBe(parentViewFingerprint(b));
    expect(parentViewFingerprint(a)).not.toBe(parentViewFingerprint(c));
  });
});

describe('buildParentView', () => {
  it('solo incluye hilos e incidentes del alumno', () => {
    const view = buildParentView('t1', student('1'), {
      subjects: [],
      notices: [],
      projects: [],
      tasks: [],
      calendarEvents: [],
      schoolInfo: {} as never,
      threads: [{ id: 'a', studentId: '1' }, { id: 'b', studentId: '2' }] as never,
      incidentReports: [{ id: 'x', studentId: '2' }, { id: 'y', studentId: '1' }] as never,
    });
    expect(view.teacherId).toBe('t1');
    expect(view.threads.map((t) => t.id)).toEqual(['a']);
    expect(view.incidentReports.map((r) => r.id)).toEqual(['y']);
  });
});

describe('generateAccessCode', () => {
  it('genera códigos de 8 caracteres sin símbolos ambiguos', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateAccessCode()));
    expect(codes.size).toBe(50);
    codes.forEach((c) => expect(c).toMatch(/^[A-HJKMNP-Z2-9]{8}$/));
  });
});
