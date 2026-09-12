// ==========================================
// 1. Roles y Autenticación (Solo Maestro y Tutor)
// ==========================================
export type UserRole = 'teacher' | 'parent';

export interface UserSubscription {
  estado: 'activa' | 'vencida' | 'pendiente';
  plan: string;
  pagoInicial: number;
  mensualidad: number;
  fechaInicio: string;
  proximoPago: string;
  ultimoPagoMonto: number;
  mesesActivo: number;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: UserRole;
  colegio: string;
  grupo?: string;
  ciclo?: string;
  maxAlumnos?: number;
  avatarUrl?: string;
  suscripcion?: UserSubscription;
  studentId?: string;
  createdAt?: string;
}

// ==========================================
// 2. Alumnos y Matrícula
// ==========================================
export type AttendanceStatus = 'presente' | 'retardo' | 'falta' | 'justificada' | 'pendiente';

export interface AttendanceDayRecord {
  status: AttendanceStatus;
  hora: string;
  notas?: string;
}

export interface StudentAttendanceTotals {
  presentes: number;
  retardos: number;
  faltas: number;
  justificadas?: number;
}

export interface StudentTrimesterGrades {
  1: Record<string, number | null>;
  2: Record<string, number | null>;
  3: Record<string, number | null>;
}

export interface Student {
  id: string;
  matricula: string;
  curp: string;
  nombre: string;
  apellidos: string;
  genero: 'M' | 'F' | 'Otro';
  fechaNacimiento?: string;
  grado: string;
  grupo: string;
  turno: 'Matutino' | 'Vespertino';
  activo: boolean;
  fotoUrl?: string;
  qrCode?: string;
  
  // Datos del Tutor
  tutorNombre: string;
  tutorTelefono: string;
  tutorEmail?: string;
  tutorParentesco?: string;
  
  // Historial y Métricas
  asistenciasPorFecha: Record<string, AttendanceDayRecord>;
  asistenciasTotales: StudentAttendanceTotals;
  calificacionesTrimestres: StudentTrimesterGrades;
  observaciones?: string;
}

// ==========================================
// 3. Materias y Calificaciones
// ==========================================
export interface Subject {
  id: string;
  nombre: string;
  clave?: string;
  grado?: string;
  creditos?: number;
}

// ==========================================
// 4. Avisos y Noticias
// ==========================================
export type NoticeAudience = 'todos' | 'profesores' | 'padres' | 'alumnos' | string;
export type NoticePriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Notice {
  id: string;
  titulo: string;
  contenido: string;
  autor: string;
  rolAutor: string;
  fecha: string;
  audiencia: NoticeAudience;
  prioridad: NoticePriority;
  destacado?: boolean;
  adjuntos?: string[];
}

// ==========================================
// 5. Mensajería Directa (Padre - Docente)
// ==========================================
export interface ChatMessage {
  id: string;
  remitente: 'teacher' | 'parent';
  texto: string;
  timestamp: string;
  leido?: boolean;
}

export interface ChatThread {
  id: string;
  studentId: string;
  studentNombre: string;
  tutorNombre: string;
  tutorTelefono: string;
  teacherNombre: string;
  ultimoMensaje: string;
  ultimaFecha: string;
  mensajesNoLeidos: number;
  mensajes: ChatMessage[];
}

// ==========================================
// 6. Información Escolar / Plantel
// ==========================================
export interface SchoolInfo {
  nombre: string;
  cct: string;
  ciclo: string;
  direccion: string;
  telefono: string;
  director: string;
  logoUrl?: string;
}

// ==========================================
// 7. Proyectos y Tareas Formativas
// ==========================================
export interface Project {
  id: string;
  titulo: string;
  campos: string[];
  fechaPub: string;
  fecha: string;
  desc: string;
  estado?: 'planeacion' | 'desarrollo' | 'concluido';
  calificaciones?: Record<string, number>;
}

export interface Task {
  id: string;
  titulo: string;
  campos: string[];
  fechaPub: string;
  fecha: string;
  desc: string;
  estado?: 'pendiente' | 'entregada' | 'revisada';
  calificaciones?: Record<string, number>;
}

// ==========================================
// 8. Calendario Escolar
// ==========================================
export type CalendarEventType = 'evento' | 'entrega' | 'evaluacion' | 'suspension';

export interface CalendarEvent {
  id: string;
  titulo: string;
  tipo: CalendarEventType;
  fecha: string;
  descripcion?: string;
}

// ==========================================
// 9. Reportes Disciplinarios y Méritos
// ==========================================
export type StudentIncidentType = 'felicitacion' | 'conducta' | 'citatorio' | 'academico' | 'aviso';

export interface StudentIncidentReport {
  id: string;
  studentId: string;
  studentName: string;
  tipo: StudentIncidentType;
  titulo: string;
  descripcion: string;
  fecha: string;
  gravedad?: 'baja' | 'media' | 'alta';
  compromisoTutor?: string;
  atendido: boolean;
  docenteNombre: string;
}

