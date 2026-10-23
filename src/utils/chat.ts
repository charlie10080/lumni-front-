import type { ChatMessage, ChatThread, Student } from '../types';

export type ChatSender = 'teacher' | 'parent';

/** Documento en `parent_chats/{codigoAcceso}/messages/{id}` */
export interface RemoteChatMessage {
  remitente: ChatSender;
  texto: string;
  createdAt: string;
  studentId: string;
  leido?: boolean;
}

export const MAX_CHAT_LENGTH = 1000;

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const toChatMessages = (docs: Array<{ id: string; data: RemoteChatMessage }>): ChatMessage[] =>
  [...docs]
    .sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt))
    .map(({ id, data }) => ({
      id,
      remitente: data.remitente,
      texto: data.texto,
      timestamp: hhmm(data.createdAt),
      leido: Boolean(data.leido),
    }));

/** Arma el hilo de un alumno; `viewer` es quien mira, para contar sus no leídos. */
export const buildChatThread = (
  student: Student,
  messages: ChatMessage[],
  viewer: ChatSender,
  teacherNombre: string
): ChatThread => {
  const last = messages[messages.length - 1];
  return {
    id: `th_${student.id}`,
    studentId: student.id,
    studentNombre: `${student.nombre} ${student.apellidos}`.trim(),
    tutorNombre: student.tutorNombre,
    tutorTelefono: student.tutorTelefono,
    teacherNombre,
    ultimoMensaje: last?.texto || '',
    ultimaFecha: last ? last.timestamp : '',
    mensajesNoLeidos: messages.filter((m) => m.remitente !== viewer && !m.leido).length,
    mensajes: messages,
  };
};

/**
 * Combina los hilos locales del aula con los mensajes en vivo de Firestore (por alumno).
 * Los mensajes remotos reemplazan a los locales del mismo alumno; el resto se conserva.
 */
export const mergeThreads = (
  local: ChatThread[],
  students: Student[],
  remote: Record<string, ChatMessage[]>,
  viewer: ChatSender,
  teacherNombre: string
): ChatThread[] => {
  const result = [...local];
  for (const student of students) {
    const messages = remote[student.id];
    if (!messages || messages.length === 0) continue;
    const thread = buildChatThread(student, messages, viewer, teacherNombre);
    const idx = result.findIndex((t) => t.studentId === student.id);
    if (idx >= 0) result[idx] = { ...result[idx], ...thread, id: result[idx].id };
    else result.unshift(thread);
  }
  return result;
};
