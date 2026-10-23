import type {
  CalendarEvent,
  ChatThread,
  Notice,
  Project,
  SchoolInfo,
  Student,
  StudentIncidentReport,
  Subject,
  Task,
} from '../types';

export interface ClassroomSnapshot {
  subjects: Subject[];
  notices: Notice[];
  threads: ChatThread[];
  projects: Project[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  incidentReports: StudentIncidentReport[];
  schoolInfo: SchoolInfo;
}

export interface ParentView extends ClassroomSnapshot {
  teacherId: string;
  studentId: string;
  student: Student;
  updatedAt: string;
}

// Sin 0/O/1/I/L para que el código se pueda dictar o copiar sin confusiones.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const generateAccessCode = (length = 8): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
};

export const normalizeKey = (value?: string): string => (value || '').toUpperCase().trim();

/** Claves antiguas (CURP y matrícula) que ya no abren una vista directa; se limpian al migrar. */
export const legacyParentKeys = (student: Student): string[] =>
  [student.curp, student.matricula]
    .map(normalizeKey)
    .filter((k, i, all) => k && k !== normalizeKey(student.codigoAcceso) && all.indexOf(k) === i);

/** Hash corto (FNV-1a) para saber si un documento cambió sin volver a escribirlo. */
export const hashString = (input: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
};

/** Huella de la vista, sin la fecha de actualización (que cambia siempre). */
export const parentViewFingerprint = (view: ParentView): string => {
  const { updatedAt: _updatedAt, ...rest } = view;
  return hashString(JSON.stringify(rest));
};

/**
 * Datos que ve un padre: únicamente los de su hijo más la información general del aula.
 * Nunca incluye a otros alumnos ni sus hilos de chat o incidentes.
 */
export const buildParentView = (
  teacherId: string,
  student: Student,
  classroom: ClassroomSnapshot
): ParentView => ({
  teacherId,
  studentId: student.id,
  student,
  subjects: classroom.subjects,
  notices: classroom.notices,
  threads: classroom.threads.filter((t) => t.studentId === student.id),
  projects: classroom.projects,
  tasks: classroom.tasks,
  calendarEvents: classroom.calendarEvents,
  incidentReports: classroom.incidentReports.filter((r) => r.studentId === student.id),
  schoolInfo: classroom.schoolInfo,
  updatedAt: new Date().toISOString(),
});
