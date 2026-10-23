import type { ChatMessage, ChatThread, Student } from '../types';

export type ChatSender = 'teacher' | 'parent';

/** Documento en `parent_chats/{codigoAcceso}/messages/{id}` */
export interface RemoteChatMessage {
  remitente: ChatSender;
  texto: string;
  createdAt: string;
  studentId: string;
}

/** Documento resumen en `parent_chats/{codigoAcceso}`: evita leer todos los mensajes para armar la bandeja. */
export interface ChatMeta {
  studentId: string;
  lastText: string;
  lastAt: string;
  lastFrom: ChatSender;
  unreadTeacher: number;
  unreadParent: number;
}

export const MAX_CHAT_LENGTH = 1000;
export const META_PREVIEW_LENGTH = 120;

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
      leido: true,
    }));

/** Arma el hilo de un alumno; `viewer` es quien mira, para contar sus no leídos. */
export const buildChatThread = (
  student: Student,
  messages: ChatMessage[],
  meta: ChatMeta,
  viewer: ChatSender,
  teacherNombre: string
): ChatThread => ({
  id: `th_${student.id}`,
  studentId: student.id,
  studentNombre: `${student.nombre} ${student.apellidos}`.trim(),
  tutorNombre: student.tutorNombre,
  tutorTelefono: student.tutorTelefono,
  teacherNombre,
  ultimoMensaje: meta.lastText,
  ultimaFecha: hhmm(meta.lastAt),
  mensajesNoLeidos: viewer === 'teacher' ? meta.unreadTeacher || 0 : meta.unreadParent || 0,
  mensajes: messages,
});

/**
 * Combina los hilos locales del aula con el resumen en vivo de Firestore (por alumno) y,
 * si el hilo está abierto, sus mensajes. El hilo remoto reemplaza al local del mismo alumno.
 */
export const mergeThreads = (
  local: ChatThread[],
  students: Student[],
  metas: Record<string, ChatMeta | undefined>,
  messages: Record<string, ChatMessage[]>,
  viewer: ChatSender,
  teacherNombre: string
): ChatThread[] => {
  const result = [...local];
  for (const student of students) {
    const meta = metas[student.id];
    if (!meta) continue;
    const thread = buildChatThread(student, messages[student.id] || [], meta, viewer, teacherNombre);
    const idx = result.findIndex((t) => t.studentId === student.id);
    if (idx >= 0) result[idx] = { ...result[idx], ...thread, id: result[idx].id };
    else result.unshift(thread);
  }
  return result;
};
