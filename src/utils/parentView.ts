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

/** Claves con las que un padre puede entrar: CURP, matrícula o código de acceso. */
export const parentViewKeys = (student: Student): string[] =>
  [student.codigoAcceso, student.curp, student.matricula]
    .map((k) => (k || '').toUpperCase().trim())
    .filter((k, i, all) => k && all.indexOf(k) === i);

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
