import { describe, expect, it } from 'vitest';
import { buildChatThread, toChatMessages } from './chat';
import type { Student } from '../types';

const student = { id: 's1', nombre: 'Ana', apellidos: 'Ruiz', tutorNombre: 'Luz', tutorTelefono: '555' } as Student;

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
  const msgs = toChatMessages([
    { id: 'a', data: { remitente: 'parent', texto: 'hola', createdAt: '2026-10-23T10:00:00.000Z', studentId: 's1' } },
    { id: 'b', data: { remitente: 'teacher', texto: 'buenas', createdAt: '2026-10-23T10:01:00.000Z', studentId: 's1', leido: true } },
    { id: 'c', data: { remitente: 'parent', texto: 'gracias', createdAt: '2026-10-23T10:02:00.000Z', studentId: 's1' } },
  ]);
  it('cuenta como no leídos solo los del otro lado', () => {
    expect(buildChatThread(student, msgs, 'teacher', 'Prof').mensajesNoLeidos).toBe(2);
    expect(buildChatThread(student, msgs, 'parent', 'Prof').mensajesNoLeidos).toBe(0);
  });
  it('toma el último mensaje', () => {
    expect(buildChatThread(student, msgs, 'teacher', 'Prof').ultimoMensaje).toBe('gracias');
  });
});

import { mergeThreads } from './chat';
import type { ChatThread } from '../types';

describe('mergeThreads', () => {
  const local = [{ id: 'th_old', studentId: 's2', mensajes: [], ultimoMensaje: 'x' }] as unknown as ChatThread[];
  const remote = {
    s1: toChatMessages([{ id: 'a', data: { remitente: 'parent', texto: 'hola', createdAt: '2026-10-23T10:00:00.000Z', studentId: 's1' } }]),
  };
  it('agrega hilos remotos y conserva los locales', () => {
    const out = mergeThreads(local, [student], remote, 'teacher', 'Prof');
    expect(out.map((t) => t.studentId)).toEqual(['s1', 's2']);
    expect(out[0].mensajes).toHaveLength(1);
  });
  it('reemplaza el hilo local del mismo alumno conservando su id', () => {
    const l = [{ id: 'th_custom', studentId: 's1', mensajes: [] }] as unknown as ChatThread[];
    const out = mergeThreads(l, [student], remote, 'parent', 'Prof');
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('th_custom');
    expect(out[0].ultimoMensaje).toBe('hola');
  });
});
