import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { AttendanceBadge } from '../components/ui/Badge';
import {
  Users,
  Award,
  CalendarCheck,
  MessageSquare,
  FileSpreadsheet,
  Phone,
  Clock,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const ParentPortalView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { students, subjects, activeTrimester, tasks, projects, schoolInfo } = useData();

  const parentStudentId = currentUser?.studentId || localStorage.getItem('lumni_parent_student_id');
  const student = students.find(
    (s) => s.id === parentStudentId || s.curp === parentStudentId || s.matricula === parentStudentId
  );

  if (!student) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Expediente de Alumno No Encontrado</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          No se encontró el registro del alumno asociado a este inicio de sesión. Por favor verifica la CURP o matrícula ingresada con el docente titular.
        </p>
      </div>
    );
  }

  const tr = activeTrimester as 1 | 2 | 3;
  const grades = student.calificacionesTrimestres[tr] || {};

  const scores = subjects
    .map((sub) => grades[sub.nombre])
    .filter((s): s is number => typeof s === 'number');

  const currentAverage = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '--';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRec = student.asistenciasPorFecha[todayStr] || student.asistenciasPorFecha['2026-09-11'];
  const todayStatus = todayRec?.status || 'presente';
  const todayHora = todayRec?.hora || '--:--';

  const teacherName = schoolInfo.director || 'Docente Titular';
  const teacherInitials = teacherName
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Parent Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-slate-950 border border-amber-500/20 p-6 lg:p-8 text-white shadow-lg shadow-amber-950/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-amber-500/20">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-semibold mb-1 backdrop-blur-xs">
                Portal de Padres y Tutores
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                ¡Bienvenida, {currentUser?.nombre}!
              </h1>
              <p className="text-amber-100/80 text-xs mt-0.5">
                Seguimiento de tu hijo(a): <strong className="text-white">{student.nombre} {student.apellidos}</strong> ({student.grado} Grado - Grupo "{student.grupo}")
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="secondary"
              leftIcon={<MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              onClick={() => onNavigate('messages')}
            >
              Contactar al Docente
            </Button>
            <Button
              variant="primary"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => onNavigate('reports')}
            >
              Descargar Boleta
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance & Performance Live Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Estado de Asistencia</p>
            <div className="mt-2">
              <AttendanceBadge status={todayStatus} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Registro: <strong className="text-slate-900 dark:text-white">{todayHora}</strong>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <StatCard
          title="Promedio Trimestre"
          value={currentAverage}
          subtitle={`Evaluación Trimestre ${activeTrimester}`}
          icon={Award}
          colorVariant="amber"
          badge={scores.length > 0 ? { text: 'Calificaciones registradas', isPositive: true } : { text: 'Pendiente captura', isPositive: false }}
        />

        <StatCard
          title="Asistencias Acumuladas"
          value={`${student.asistenciasTotales.presentes || 0} Sesiones`}
          subtitle={`${student.asistenciasTotales.faltas || 0} faltas acumuladas`}
          icon={CalendarCheck}
          colorVariant="emerald"
        />
      </div>

      {/* Breakdown Grades Table & Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Desglose de Calificaciones por Materia</CardTitle>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Trimestre {activeTrimester}</span>
            </CardHeader>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {subjects.map((sub) => {
                const score = grades[sub.nombre];
                return (
                  <div key={sub.id} className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.nombre}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{teacherName}</p>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 rounded-xl text-sm font-extrabold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                        {score !== null && score !== undefined ? score : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                ⚠️ Calificaciones informativas de control interno escolar (no oficiales).
              </p>
            </div>
          </Card>

          {/* Child's Assigned Tasks */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Tareas y Asignaciones para Casa
              </CardTitle>
            </CardHeader>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No hay tareas o asignaciones pendientes en este momento.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{task.titulo}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.desc}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Entrega: {task.fecha}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Teacher Contact Info & Projects Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profesor Titular</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                  {teacherInitials || 'DO'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{teacherName}</p>
                  <p className="text-slate-500 dark:text-slate-400">Titular de {student.grado} Grupo {student.grupo}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {schoolInfo.telefono || '(55) 0000-0000'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-2"
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('messages')}
              >
                Abrir Chat Directo
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Proyectos del Grupo
              </CardTitle>
            </CardHeader>
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">No hay proyectos grupales registrados actualmente.</p>
            ) : (
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{proj.titulo}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Fecha límite: {proj.fecha}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
