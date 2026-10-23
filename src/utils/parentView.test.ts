import { describe, expect, it } from 'vitest';
import { buildParentView, generateAccessCode, parentViewKeys } from './parentView';
import type { Student } from '../types';

const student = (id: string, extra: Partial<Student> = {}) =>
  ({ id, curp: `CURP${id}`, matricula: `LUM-2026-00${id}`, nombre: `N${id}`, ...extra }) as Student;

describe('parentViewKeys', () => {
  it('incluye código, CURP y matrícula en mayúsculas sin repetir', () => {
    expect(parentViewKeys(student('1', { codigoAcceso: 'abc234', curp: 'x1' }))).toEqual(['ABC234', 'X1', 'LUM-2026-001']);
    expect(parentViewKeys(student('2', { curp: 'same', matricula: 'SAME' }))).toEqual(['SAME']);
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
