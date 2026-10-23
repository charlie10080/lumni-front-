import { describe, expect, it } from 'vitest';
import { buildChatThread, mergeThreads, toChatMessages, type ChatMeta } from './chat';
import type { ChatThread, Student } from '../types';

const student = { id: 's1', nombre: 'Ana', apellidos: 'Ruiz', tutorNombre: 'Luz', tutorTelefono: '555' } as Student;
const meta: ChatMeta = {
  studentId: 's1',
  lastText: 'gracias',
  lastAt: '2026-10-23T10:02:00.000Z',
  lastFrom: 'parent',
  unreadTeacher: 2,
  unreadParent: 0,
};

describe('toChatMessages', () => {
  it('ordena por fecha de creación', () => {
    const msgs = toChatMessages([
      { id: 'b', data: { remitente: 'teacher', texto: 'dos', createdAt: '2026-10-23T10:05:00.000Z', studentId: 's1' } },
      { id: 'a', data: { remitente: 'parent', texto: 'uno', createdAt: '2026-10-23T10:00:00.000Z', studentId: 's1' } },
    ]);
    expect(msgs.map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('buildChatThread', () => {
  it('cuenta los no leídos de quien mira', () => {
    expect(buildChatThread(student, [], meta, 'teacher', 'Prof').mensajesNoLeidos).toBe(2);
    expect(buildChatThread(student, [], meta, 'parent', 'Prof').mensajesNoLeidos).toBe(0);
  });
  it('toma el último mensaje del resumen', () => {
    expect(buildChatThread(student, [], meta, 'teacher', 'Prof').ultimoMensaje).toBe('gracias');
  });
});

describe('mergeThreads', () => {
  const local = [{ id: 'th_old', studentId: 's2', mensajes: [], ultimoMensaje: 'x' }] as unknown as ChatThread[];
  it('agrega hilos remotos y conserva los locales', () => {
    const out = mergeThreads(local, [student], { s1: meta }, {}, 'teacher', 'Prof');
    expect(out.map((t) => t.studentId)).toEqual(['s1', 's2']);
  });
  it('reemplaza el hilo local del mismo alumno conservando su id y trae los mensajes abiertos', () => {
    const l = [{ id: 'th_custom', studentId: 's1', mensajes: [] }] as unknown as ChatThread[];
    const msgs = toChatMessages([
      { id: 'a', data: { remitente: 'parent', texto: 'hola', createdAt: '2026-10-23T10:00:00.000Z', studentId: 's1' } },
    ]);
    const out = mergeThreads(l, [student], { s1: meta }, { s1: msgs }, 'parent', 'Prof');
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('th_custom');
    expect(out[0].mensajes).toHaveLength(1);
  });
  it('ignora alumnos sin resumen', () => {
    expect(mergeThreads([], [student], {}, {}, 'teacher', 'Prof')).toEqual([]);
  });
});
