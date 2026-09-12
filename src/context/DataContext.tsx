import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  Subject,
  Notice,
  ChatThread,
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
  exportFullBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => boolean;
  resetToDefaultData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('lumni_students_v2');
    return saved ? JSON.parse(saved) : mockStudents;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('lumni_subjects_v2');
    return saved ? JSON.parse(saved) : mockSubjects;
  });

  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('lumni_notices_v2');
    return saved ? JSON.parse(saved) : mockNotices;
  });

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('lumni_threads_v2');
    return saved ? JSON.parse(saved) : mockThreads;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('lumni_projects_v2');
    return saved ? JSON.parse(saved) : mockProjects;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('lumni_tasks_v2');
    return saved ? JSON.parse(saved) : mockTasks;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('lumni_calendar_v2');
    return saved ? JSON.parse(saved) : mockCalendarEvents;
  });

  const [incidentReports, setIncidentReports] = useState<StudentIncidentReport[]>(() => {
    const saved = localStorage.getItem('lumni_incidents_v2');
    return saved ? JSON.parse(saved) : mockIncidentReports;
  });

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('lumni_school_v2');
    return saved ? JSON.parse(saved) : mockSchoolInfo;
  });

  const [activeTrimester, setActiveTrimester] = useState<number>(1);

  // Guardar en LocalStorage
  useEffect(() => {
    localStorage.setItem('lumni_students_v2', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('lumni_subjects_v2', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('lumni_notices_v2', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('lumni_threads_v2', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('lumni_projects_v2', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('lumni_tasks_v2', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('lumni_calendar_v2', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('lumni_incidents_v2', JSON.stringify(incidentReports));
  }, [incidentReports]);

  useEffect(() => {
    localStorage.setItem('lumni_school_v2', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

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

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  };

  const deleteStudent = (id: string) => {
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
  const sendMessage = (
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
          teacherNombre: 'Docente Titular',
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
    setStudents(mockStudents);
    setSubjects(mockSubjects);
    setNotices(mockNotices);
    setThreads(mockThreads);
    setProjects(mockProjects);
    setTasks(mockTasks);
    setCalendarEvents(mockCalendarEvents);
    setIncidentReports(mockIncidentReports);
    setSchoolInfo(mockSchoolInfo);
    localStorage.clear();
  };

  return (
    <DataContext.Provider
      value={{
        students,
        subjects,
        notices,
        threads,
        projects,
        tasks,
        calendarEvents,
        incidentReports,
        schoolInfo,
        activeTrimester,
        setActiveTrimester,
        addStudent,
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
