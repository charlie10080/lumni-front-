import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Student,
  Subject,
  Notice,
  ChatThread,
  ChatMessage,
  SchoolInfo,
  AttendanceStatus,
  Project,
  Task,
  CalendarEvent,
  StudentIncidentReport,
} from '../types';
import {
  mockStudents,
  mockSubjects,
  mockNotices,
  mockThreads,
  mockSchoolInfo,
  mockProjects,
  mockTasks,
  mockCalendarEvents,
  mockIncidentReports,
} from '../services/mockData';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, limit, increment, writeBatch } from 'firebase/firestore';
import {
  mergeThreads,
  toChatMessages,
  MAX_CHAT_LENGTH,
  META_PREVIEW_LENGTH,
  type ChatMeta,
  type ChatSender,
  type RemoteChatMessage,
} from '../utils/chat';
import { generateAccessCode } from '../utils/parentView';
import { syncParentAccess, removeParentAccess, migrateLegacyParentKeys } from '../services/parentAccess';

interface DataContextType {
  students: Student[];
  subjects: Subject[];
  notices: Notice[];
  threads: ChatThread[];
  projects: Project[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  incidentReports: StudentIncidentReport[];
  schoolInfo: SchoolInfo;
  activeTrimester: number;
  setActiveTrimester: (trimester: number) => void;
  addStudent: (student: Omit<Student, 'id' | 'asistenciasPorFecha' | 'asistenciasTotales' | 'calificacionesTrimestres'>) => void;
  addBulkStudents: (students: Array<Omit<Student, 'id' | 'asistenciasPorFecha' | 'asistenciasTotales' | 'calificacionesTrimestres'>>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addSubject: (name: string, clave?: string) => void;
  deleteSubject: (id: string) => void;
  setAttendance: (studentId: string, date: string, status: AttendanceStatus, notes?: string) => void;
  setBulkAttendance: (date: string, status: AttendanceStatus) => void;
  updateGrade: (studentId: string, trimester: 1 | 2 | 3, subjectName: string, score: number | null) => void;
  addNotice: (notice: Omit<Notice, 'id' | 'fecha'>) => void;
  deleteNotice: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'fechaPub'>) => void;
  deleteProject: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'fechaPub'>) => void;
  deleteTask: (id: string) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (id: string) => void;
  addIncidentReport: (report: Omit<StudentIncidentReport, 'id' | 'fecha'>) => void;
  deleteIncidentReport: (id: string) => void;
  toggleIncidentStatus: (id: string) => void;
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;
  sendMessage: (
    threadId: string,
    text: string,
    sender: 'teacher' | 'parent',
    meta?: { studentId: string; studentNombre: string; tutorNombre: string; tutorTelefono: string }
  ) => void;
  openChat: (studentId: string) => void;
  markThreadRead: (studentId: string) => void;
  exportFullBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => boolean;
  resetToDefaultData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Plantilla limpia oficial de materias de la SEP (Nueva Escuela Mexicana)
export const cleanDefaultSubjects: Subject[] = [
  { id: 'sub_1', nombre: 'Lenguajes', clave: 'LEN-101' },
  { id: 'sub_2', nombre: 'Saberes y Pensamiento Científico', clave: 'SAB-102' },
  { id: 'sub_3', nombre: 'Ética, Naturaleza y Sociedades', clave: 'ETI-103' },
  { id: 'sub_4', nombre: 'De lo Humano y lo Comunitario', clave: 'HUM-104' },
  { id: 'sub_5', nombre: 'Inglés', clave: 'ING-105' },
];

// Plantilla limpia de calendario oficial de ciclo escolar
export const cleanDefaultCalendar: CalendarEvent[] = [
  { id: 'cal_1', titulo: 'Inicio de Ciclo Escolar', tipo: 'evento', fecha: '2026-08-28', descripcion: 'Bienvenida a clases y organización del aula escolar.' },
  { id: 'cal_2', titulo: 'Consejo Técnico Escolar (CTE)', tipo: 'suspension', fecha: '2026-09-25', descripcion: 'Sesión ordinaria de planeación pedagógica docente.' },
  { id: 'cal_3', titulo: 'Evaluación 1er Trimestre', tipo: 'evaluacion', fecha: '2026-11-15', descripcion: 'Captura y cierre de calificaciones del primer periodo formativo.' },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  // Calcular el scope único de datos:
  // - Si no hay usuario logueado: 'guest' (estado 100% limpio en memoria para evitar contaminaciones)
  // - Si es usuario demo (Prof. Carlos Mendoza / Laura Soto): 'demo'
  // - Si es padre de familia: el ID del maestro de su hijo ('lumni_parent_scope_id')
  // - Si es maestro registrado: su UID único de Firebase / cuenta
  // Scope único de datos por cuenta
  const isDemo =
    currentUser?.id === 'usr_prof_01' ||
    currentUser?.id === 'usr_tutor_01' ||
    currentUser?.email === 'carlos.mendoza@colegio.edu.mx' ||
    currentUser?.email === 'laura.soto@correo.com';

  const scopeKey = !currentUser
    ? 'guest'
    : isDemo
    ? 'demo'
    : role === 'parent'
    ? localStorage.getItem('lumni_parent_scope_id') || 'guest'
    : currentUser.id || 'guest';

  // Helper para leer del localStorage por scope
  const getScopedData = useCallback(<T,>(keySuffix: string, fallbackDemo: T, fallbackClean: T, activeScope: string): T => {
    if (activeScope === 'guest') return fallbackClean;
    const storageKey = `lumni_acc_${activeScope}_${keySuffix}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return activeScope === 'demo' ? fallbackDemo : fallbackClean;
      }
    }
    return activeScope === 'demo' ? fallbackDemo : fallbackClean;
  }, []);

  const getCleanSchoolInfo = useCallback((): SchoolInfo => {
    return {
      nombre: currentUser?.colegio || 'Colegio Lumni',
      cct: '09DPR0001X',
      ciclo: currentUser?.ciclo || '2026-2027',
      direccion: 'Plantel Escolar',
      telefono: '(55) 0000-0000',
      director: currentUser?.nombre ? `${currentUser.nombre} ${currentUser.apellidos || ''}`.trim() : 'Director(a) Escolar',
    };
  }, [currentUser]);

  // Estados locales (100% limpios para toda cuenta nueva)
  const [students, setStudents] = useState<Student[]>(() => getScopedData('students', mockStudents, [], scopeKey));
  const [subjects, setSubjects] = useState<Subject[]>(() => getScopedData('subjects', mockSubjects, cleanDefaultSubjects, scopeKey));
  const [notices, setNotices] = useState<Notice[]>(() => getScopedData('notices', mockNotices, [], scopeKey));
  const [threads, setThreads] = useState<ChatThread[]>(() => getScopedData('threads', mockThreads, [], scopeKey));
  const [projects, setProjects] = useState<Project[]>(() => getScopedData('projects', mockProjects, [], scopeKey));
  const [tasks, setTasks] = useState<Task[]>(() => getScopedData('tasks', mockTasks, [], scopeKey));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => getScopedData('calendar', mockCalendarEvents, cleanDefaultCalendar, scopeKey));
  const [incidentReports, setIncidentReports] = useState<StudentIncidentReport[]>(() => getScopedData('incidents', mockIncidentReports, [], scopeKey));
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => getScopedData('school', mockSchoolInfo, getCleanSchoolInfo(), scopeKey));


  const [activeTrimester, setActiveTrimester] = useState<number>(1);

  // Chat maestro-padre en vivo. Para no leer de más:
  //  - un documento resumen por alumno (parent_chats/{codigo}): último mensaje y no leídos
  //  - los mensajes (parent_chats/{codigo}/messages) solo del hilo abierto, los últimos 50
  const [chatMetas, setChatMetas] = useState<Record<string, ChatMeta | undefined>>({});
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [openStudentId, setOpenStudentId] = useState<string>('');
  const chatEnabled =
    isFirebaseConfigured && !!db && scopeKey !== 'guest' && scopeKey !== 'demo' && (role === 'teacher' || role === 'parent');
  const viewer: ChatSender = role === 'parent' ? 'parent' : 'teacher';
  const studentsRef = useRef(students);
  studentsRef.current = students;
  const chatKeys = students.map((st) => `${st.id}:${st.codigoAcceso || ''}`).join('|');
  // El padre solo tiene un hilo; el maestro abre el que elija en la bandeja
  const activeChatStudentId = role === 'parent' ? students[0]?.id || '' : openStudentId;
  const codeOf = (studentId: string) => students.find((st) => st.id === studentId)?.codigoAcceso;

  // Resúmenes: un listener por alumno (el padre, uno solo)
  useEffect(() => {
    setChatMetas({});
    if (!chatEnabled || !db) return;
    const firestore = db;
    const unsubscribers = studentsRef.current
      .filter((st) => st.codigoAcceso)
      .map((st) =>
        onSnapshot(
          doc(firestore, 'parent_chats', st.codigoAcceso as string),
          (snap) => setChatMetas((prev) => ({ ...prev, [st.id]: snap.exists() ? (snap.data() as ChatMeta) : undefined })),
          (err) => console.warn('Chat summary listener error:', err)
        )
      );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [chatEnabled, chatKeys, scopeKey]);

  // Mensajes: solo del hilo abierto
  useEffect(() => {
    if (!chatEnabled || !db || !activeChatStudentId) return;
    const code = studentsRef.current.find((st) => st.id === activeChatStudentId)?.codigoAcceso;
    if (!code) return;
    return onSnapshot(
      query(collection(db, 'parent_chats', code, 'messages'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() as RemoteChatMessage }));
        setChatMessages((prev) => ({ ...prev, [activeChatStudentId]: toChatMessages(docs) }));
      },
      (err) => console.warn('Chat messages listener error:', err)
    );
  }, [chatEnabled, activeChatStudentId, chatKeys, scopeKey]);

  const mergedThreads = useMemo(
    () =>
      chatEnabled
        ? mergeThreads(threads, students, chatMetas, chatMessages, viewer, schoolInfo.director || 'Docente Titular')
        : threads,
    [chatEnabled, threads, students, chatMetas, chatMessages, viewer, schoolInfo.director]
  );

  const openChat = (studentId: string) => setOpenStudentId(studentId);

  const markThreadRead = (studentId: string) => {
    const code = codeOf(studentId);
    if (!chatEnabled || !db || !code) return;
    const counter = viewer === 'teacher' ? 'unreadTeacher' : 'unreadParent';
    setDoc(doc(db, 'parent_chats', code), { [counter]: 0 }, { merge: true }).catch((e) =>
      console.warn('Error marking chat as read:', e)
    );
  };

  // Referencia para saber cuál scope está cargado actualmente en el estado y evitar sobreescrituras por race-conditions
  const loadedScopeRef = useRef<string>(scopeKey);
  const isInitialLoadRef = useRef<boolean>(true);

  // 1. Recargar datos del scope cuando cambia de usuario / cuenta
  useEffect(() => {
    if (loadedScopeRef.current !== scopeKey || isInitialLoadRef.current) {
      loadedScopeRef.current = scopeKey;
      isInitialLoadRef.current = false;

      const loadedStudents = getScopedData('students', mockStudents, [], scopeKey);
      const loadedSubjects = getScopedData('subjects', mockSubjects, cleanDefaultSubjects, scopeKey);
      const loadedNotices = getScopedData('notices', mockNotices, [], scopeKey);
      const loadedThreads = getScopedData('threads', mockThreads, [], scopeKey);
      const loadedProjects = getScopedData('projects', mockProjects, [], scopeKey);
      const loadedTasks = getScopedData('tasks', mockTasks, [], scopeKey);
      const loadedCalendar = getScopedData('calendar', mockCalendarEvents, cleanDefaultCalendar, scopeKey);
      const loadedIncidents = getScopedData('incidents', mockIncidentReports, [], scopeKey);
      const loadedSchool = getScopedData('school', mockSchoolInfo, getCleanSchoolInfo(), scopeKey);

      setStudents(loadedStudents);
      setSubjects(loadedSubjects);
      setNotices(loadedNotices);
      setThreads(loadedThreads);
      setProjects(loadedProjects);
      setTasks(loadedTasks);
      setCalendarEvents(loadedCalendar);
      setIncidentReports(loadedIncidents);
      setSchoolInfo(loadedSchool);

      // Si Firebase está configurado y es una cuenta real de maestro, cargar o inicializar en Firestore
      if (isFirebaseConfigured && db && scopeKey !== 'guest' && scopeKey !== 'demo') {
        const firestore = db;
        const fetchFirestoreData = async () => {
          try {
            if (role === 'parent') {
              // Los padres solo leen su vista individual; nunca el aula completa
              const viewKey = localStorage.getItem('lumni_parent_view_key');
              if (!viewKey) return;
              const viewDoc = await getDoc(doc(firestore, 'parent_views', viewKey));
              if (viewDoc.exists()) {
                const v = viewDoc.data();
                if (v.student) setStudents([v.student]);
                if (v.subjects) setSubjects(v.subjects);
                if (v.notices) setNotices(v.notices);
                if (v.threads) setThreads(v.threads);
                if (v.projects) setProjects(v.projects);
                if (v.tasks) setTasks(v.tasks);
                if (v.calendarEvents) setCalendarEvents(v.calendarEvents);
                if (v.incidentReports) setIncidentReports(v.incidentReports);
                if (v.schoolInfo) setSchoolInfo(v.schoolInfo);
              }
              return;
            }
            const classroomDoc = await getDoc(doc(firestore, 'classrooms', scopeKey));
            if (classroomDoc.exists()) {
              const fbData = classroomDoc.data();
              if (fbData.students) setStudents(fbData.students);
              if (fbData.subjects) setSubjects(fbData.subjects);
              if (fbData.notices) setNotices(fbData.notices);
              if (fbData.threads) setThreads(fbData.threads);
              if (fbData.projects) setProjects(fbData.projects);
              if (fbData.tasks) setTasks(fbData.tasks);
              if (fbData.calendarEvents) setCalendarEvents(fbData.calendarEvents);
              if (fbData.incidentReports) setIncidentReports(fbData.incidentReports);
              if (fbData.schoolInfo) setSchoolInfo(fbData.schoolInfo);
            } else if (role === 'teacher') {
              // Inicializar aula limpia en Firestore para nueva cuenta de maestro
              const cleanPayload = {
                teacherId: scopeKey,
                teacherEmail: currentUser?.email || '',
                students: [],
                subjects: cleanDefaultSubjects,
                notices: [],
                threads: [],
                projects: [],
                tasks: [],
                calendarEvents: cleanDefaultCalendar,
                incidentReports: [],
                schoolInfo: getCleanSchoolInfo(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(doc(firestore, 'classrooms', scopeKey), cleanPayload);
            }
          } catch (err) {
            console.warn('Could not sync with Firestore classroom:', err);
          }
        };

        fetchFirestoreData();
      }
    }
  }, [scopeKey, getScopedData, getCleanSchoolInfo, currentUser, role]);

  // Asigna un código de acceso aleatorio a los alumnos que aún no lo tienen (solo maestros)
  useEffect(() => {
    if (role !== 'teacher' || scopeKey === 'guest' || scopeKey === 'demo' || loadedScopeRef.current !== scopeKey) return;
    if (students.some((s) => !s.codigoAcceso || s.fotoUrl)) {
      // También se descartan las fotos antiguas (ya no se usan y ocupaban espacio en el aula)
      setStudents((prev) =>
        prev.map(({ fotoUrl: _foto, ...s }) => (s.codigoAcceso ? s : { ...s, codigoAcceso: generateAccessCode() }))
      );
    }
  }, [students, role, scopeKey]);

  // 2. Guardar en LocalStorage y Firestore únicamente cuando los datos pertenecen al scope activo
  useEffect(() => {
    if (scopeKey === 'guest' || loadedScopeRef.current !== scopeKey) return;

    localStorage.setItem(`lumni_acc_${scopeKey}_students`, JSON.stringify(students));
    localStorage.setItem(`lumni_acc_${scopeKey}_subjects`, JSON.stringify(subjects));
    localStorage.setItem(`lumni_acc_${scopeKey}_notices`, JSON.stringify(notices));
    localStorage.setItem(`lumni_acc_${scopeKey}_threads`, JSON.stringify(threads));
    localStorage.setItem(`lumni_acc_${scopeKey}_projects`, JSON.stringify(projects));
    localStorage.setItem(`lumni_acc_${scopeKey}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`lumni_acc_${scopeKey}_calendar`, JSON.stringify(calendarEvents));
    localStorage.setItem(`lumni_acc_${scopeKey}_incidents`, JSON.stringify(incidentReports));
    localStorage.setItem(`lumni_acc_${scopeKey}_school`, JSON.stringify(schoolInfo));

    // Sincronizar aula y directorio de alumnos con Firestore en segundo plano si es maestro
    if (isFirebaseConfigured && db && scopeKey !== 'demo' && role === 'teacher') {
      const firestore = db;
      const timer = setTimeout(async () => {
        try {
          await setDoc(
            doc(firestore, 'classrooms', scopeKey),
            {
              teacherId: scopeKey,
              teacherEmail: currentUser?.email || '',
              students,
              subjects,
              notices,
              threads: threads.map((t) => ({ ...t, mensajes: [] })),
              projects,
              tasks,
              calendarEvents,
              incidentReports,
              schoolInfo,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          // Vista de padres: un documento por alumno con solo sus datos (solo se escribe lo que cambió)
          await migrateLegacyParentKeys(firestore, scopeKey, students);
          const classroom = { subjects, notices, threads: threads.map((t) => ({ ...t, mensajes: [] })), projects, tasks, calendarEvents, incidentReports, schoolInfo };
          await syncParentAccess(firestore, scopeKey, students, classroom);
        } catch (err) {
          console.warn('Background Firestore sync error:', err);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [students, subjects, notices, threads, projects, tasks, calendarEvents, incidentReports, schoolInfo, scopeKey, role, currentUser]);

  // Funciones de Alumnos
  const addStudent = (studentData: Omit<Student, 'id' | 'asistenciasPorFecha' | 'asistenciasTotales' | 'calificacionesTrimestres'>) => {
    const newId = `stu_${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      asistenciasPorFecha: {},
      asistenciasTotales: { presentes: 0, retardos: 0, faltas: 0, justificadas: 0 },
      calificacionesTrimestres: { 1: {}, 2: {}, 3: {} },
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  const addBulkStudents = (
    newStudentsData: Array<Omit<Student, 'id' | 'asistenciasPorFecha' | 'asistenciasTotales' | 'calificacionesTrimestres'>>
  ) => {
    const baseTimestamp = Date.now();
    const createdStudents: Student[] = newStudentsData.map((data, index) => ({
      ...data,
      id: `stu_${baseTimestamp}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      asistenciasPorFecha: {},
      asistenciasTotales: { presentes: 0, retardos: 0, faltas: 0, justificadas: 0 },
      calificacionesTrimestres: { 1: {}, 2: {}, 3: {} },
    }));

    setStudents((prev) => [...createdStudents, ...prev]);
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  };

  const deleteStudent = (id: string) => {
    const removed = students.find((s) => s.id === id);
    if (removed && isFirebaseConfigured && db && role === 'teacher') {
      // Revocar el acceso de los padres a este alumno
      removeParentAccess(db, removed);
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Funciones de Materias Dinámicas
  const addSubject = (name: string, clave?: string) => {
    if (!name.trim()) return;
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      nombre: name.trim(),
      clave: clave?.trim() || `MAT-${Math.floor(100 + Math.random() * 900)}`,
    };
    setSubjects((prev) => [...prev, newSub]);
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // Asistencias
  const setAttendance = (studentId: string, date: string, status: AttendanceStatus, notes?: string) => {
    const now = new Date();
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedAsistencias = {
          ...student.asistenciasPorFecha,
          [date]: { status, hora: status === 'falta' ? '--:--' : hora, notas: notes },
        };

        let presentes = 0;
        let retardos = 0;
        let faltas = 0;
        let justificadas = 0;

        Object.values(updatedAsistencias).forEach((rec) => {
          if (rec.status === 'presente') presentes++;
          else if (rec.status === 'retardo') retardos++;
          else if (rec.status === 'falta') faltas++;
          else if (rec.status === 'justificada') justificadas++;
        });

        return {
          ...student,
          asistenciasPorFecha: updatedAsistencias,
          asistenciasTotales: { presentes, retardos, faltas, justificadas },
        };
      })
    );
  };

  const setBulkAttendance = (date: string, status: AttendanceStatus) => {
    const now = new Date();
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setStudents((prev) =>
      prev.map((student) => {
        const updatedAsistencias = {
          ...student.asistenciasPorFecha,
          [date]: { status, hora: status === 'falta' ? '--:--' : hora },
        };

        let presentes = 0;
        let retardos = 0;
        let faltas = 0;
        let justificadas = 0;

        Object.values(updatedAsistencias).forEach((rec) => {
          if (rec.status === 'presente') presentes++;
          else if (rec.status === 'retardo') retardos++;
          else if (rec.status === 'falta') faltas++;
          else if (rec.status === 'justificada') justificadas++;
        });

        return {
          ...student,
          asistenciasPorFecha: updatedAsistencias,
          asistenciasTotales: { presentes, retardos, faltas, justificadas },
        };
      })
    );
  };

  // Calificaciones
  const updateGrade = (studentId: string, trimester: 1 | 2 | 3, subjectName: string, score: number | null) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const currentTrimestres = { ...student.calificacionesTrimestres };
        currentTrimestres[trimester] = {
          ...currentTrimestres[trimester],
          [subjectName]: score,
        };

        return {
          ...student,
          calificacionesTrimestres: currentTrimestres,
        };
      })
    );
  };

  // Avisos
  const addNotice = (noticeData: Omit<Notice, 'id' | 'fecha'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newNotice: Notice = {
      ...noticeData,
      id: `not_${Date.now()}`,
      fecha: now,
    };
    setNotices((prev) => [newNotice, ...prev]);
  };

  const deleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  // Mensajes
  const sendLocalMessage = (
    threadId: string,
    texto: string,
    sender: 'teacher' | 'parent',
    meta?: { studentId: string; studentNombre: string; tutorNombre: string; tutorTelefono: string }
  ) => {
    const now = new Date();
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fechaCompleta = `${now.toISOString().split('T')[0]} ${hora}`;

    setThreads((prev) => {
      const exists = prev.some((th) => th.id === threadId || (meta && th.studentId === meta.studentId));
      if (!exists && meta) {
        const newThread: ChatThread = {
          id: threadId,
          studentId: meta.studentId,
          studentNombre: meta.studentNombre,
          tutorNombre: meta.tutorNombre,
          tutorTelefono: meta.tutorTelefono,
          teacherNombre: schoolInfo.director || 'Docente Titular',
          ultimoMensaje: texto,
          ultimaFecha: fechaCompleta,
          mensajesNoLeidos: 0,
          mensajes: [
            {
              id: `msg_${Date.now()}`,
              remitente: sender,
              texto,
              timestamp: hora,
              leido: true,
            },
          ],
        };
        return [newThread, ...prev];
      }

      return prev.map((th) => {
        if (th.id !== threadId && (!meta || th.studentId !== meta.studentId)) return th;
        return {
          ...th,
          ultimoMensaje: texto,
          ultimaFecha: fechaCompleta,
          mensajes: [
            ...th.mensajes,
            {
              id: `msg_${Date.now()}`,
              remitente: sender,
              texto,
              timestamp: hora,
              leido: true,
            },
          ],
        };
      });
    });
  };

  const sendMessage = (
    threadId: string,
    texto: string,
    sender: 'teacher' | 'parent',
    meta?: { studentId: string; studentNombre: string; tutorNombre: string; tutorTelefono: string }
  ) => {
    const studentId = meta?.studentId || threads.find((th) => th.id === threadId)?.studentId;
    const code = students.find((st) => st.id === studentId)?.codigoAcceso;
    const text = texto.trim().slice(0, MAX_CHAT_LENGTH);
    if (!chatEnabled || !db || !code || !studentId || !text) {
      sendLocalMessage(threadId, texto, sender, meta);
      return;
    }
    const createdAt = new Date().toISOString();
    const message: RemoteChatMessage = { remitente: sender, texto: text, createdAt, studentId };
    const summary = {
      studentId,
      lastText: text.slice(0, META_PREVIEW_LENGTH),
      lastAt: createdAt,
      lastFrom: sender,
      // El que escribe ya vio el hilo; el otro suma un no leído
      unreadTeacher: sender === 'parent' ? increment(1) : 0,
      unreadParent: sender === 'teacher' ? increment(1) : 0,
    };
    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'parent_chats', code, 'messages')), message);
    batch.set(doc(db, 'parent_chats', code), summary, { merge: true });
    batch.commit().catch((err) => {
      console.warn('Could not send chat message:', err);
      sendLocalMessage(threadId, texto, sender, meta);
    });
  };

  // Proyectos
  const addProject = (projectData: Omit<Project, 'id' | 'fechaPub'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newProj: Project = {
      ...projectData,
      id: `proj_${Date.now()}`,
      fechaPub: now,
      estado: projectData.estado || 'desarrollo',
    };
    setProjects((prev) => [newProj, ...prev]);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Tareas
  const addTask = (taskData: Omit<Task, 'id' | 'fechaPub'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      ...taskData,
      id: `tsk_${Date.now()}`,
      fechaPub: now,
      estado: taskData.estado || 'pendiente',
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Calendario
  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEv: CalendarEvent = {
      ...eventData,
      id: `cal_${Date.now()}`,
    };
    setCalendarEvents((prev) => [...prev, newEv]);
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const updateSchoolInfo = (info: Partial<SchoolInfo>) => {
    setSchoolInfo((prev) => ({ ...prev, ...info }));
  };

  // Reportes Disciplinarios y Méritos
  const addIncidentReport = (reportData: Omit<StudentIncidentReport, 'id' | 'fecha'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newIncident: StudentIncidentReport = {
      ...reportData,
      id: `inc_${Date.now()}`,
      fecha: now,
    };
    setIncidentReports((prev) => [newIncident, ...prev]);
  };

  const deleteIncidentReport = (id: string) => {
    setIncidentReports((prev) => prev.filter((inc) => inc.id !== id));
  };

  const toggleIncidentStatus = (id: string) => {
    setIncidentReports((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, atendido: !inc.atendido } : inc))
    );
  };

  // Respaldo y Restauración de Datos JSON
  const exportFullBackupJSON = () => {
    const fullBackup = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      schoolInfo,
      students,
      subjects,
      notices,
      threads,
      projects,
      tasks,
      calendarEvents,
      incidentReports,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lumni_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackupJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.students && Array.isArray(parsed.students)) {
        setStudents(parsed.students);
        if (parsed.subjects) setSubjects(parsed.subjects);
        if (parsed.notices) setNotices(parsed.notices);
        if (parsed.threads) setThreads(parsed.threads);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
        if (parsed.incidentReports) setIncidentReports(parsed.incidentReports);
        if (parsed.schoolInfo) setSchoolInfo(parsed.schoolInfo);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetToDefaultData = () => {
    if (scopeKey === 'demo') {
      setStudents(mockStudents);
      setSubjects(mockSubjects);
      setNotices(mockNotices);
      setThreads(mockThreads);
      setProjects(mockProjects);
      setTasks(mockTasks);
      setCalendarEvents(mockCalendarEvents);
      setIncidentReports(mockIncidentReports);
      setSchoolInfo(mockSchoolInfo);
      localStorage.removeItem('lumni_acc_demo_students');
      localStorage.removeItem('lumni_acc_demo_subjects');
      localStorage.removeItem('lumni_acc_demo_notices');
      localStorage.removeItem('lumni_acc_demo_threads');
      localStorage.removeItem('lumni_acc_demo_projects');
      localStorage.removeItem('lumni_acc_demo_tasks');
      localStorage.removeItem('lumni_acc_demo_calendar');
      localStorage.removeItem('lumni_acc_demo_incidents');
      localStorage.removeItem('lumni_acc_demo_school');
    } else {
      setStudents([]);
      setSubjects(cleanDefaultSubjects);
      setNotices([]);
      setThreads([]);
      setProjects([]);
      setTasks([]);
      setCalendarEvents(cleanDefaultCalendar);
      setIncidentReports([]);
      setSchoolInfo(getCleanSchoolInfo());
    }
  };

  return (
    <DataContext.Provider
      value={{
        students,
        subjects,
        notices,
        threads: mergedThreads,
        projects,
        tasks,
        calendarEvents,
        incidentReports,
        schoolInfo,
        activeTrimester,
        setActiveTrimester,
        addStudent,
        addBulkStudents,
        updateStudent,
        deleteStudent,
        addSubject,
        deleteSubject,
        setAttendance,
        setBulkAttendance,
        updateGrade,
        addNotice,
        deleteNotice,
        addProject,
        deleteProject,
        addTask,
        deleteTask,
        addCalendarEvent,
        deleteCalendarEvent,
        addIncidentReport,
        deleteIncidentReport,
        toggleIncidentStatus,
        sendMessage,
        openChat,
        markThreadRead,
        updateSchoolInfo,
        exportFullBackupJSON,
        importBackupJSON,
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
