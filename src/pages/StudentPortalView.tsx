import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Award,
  CalendarCheck,
  Bell,
  QrCode,
  Sparkles,
  BookOpen,
  FolderKanban,
  CheckSquare,
  Calendar,
} from 'lucide-react';

export const StudentPortalView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { students, subjects, notices, activeTrimester, projects, tasks } = useData();

  // Find current student or default to Mateo
  const student = students.find((s) => s.nombre.toLowerCase().includes('mateo')) || students[0];

  const tr = activeTrimester as 1 | 2 | 3;
  const grades = student?.calificacionesTrimestres[tr] || {};

  const scores = subjects
    .map((sub) => grades[sub.nombre])
    .filter((s): s is number => typeof s === 'number');

  const currentAverage = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '9.5';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Student Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 border border-emerald-500/20 p-6 lg:p-8 text-white shadow-lg shadow-emerald-950/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-emerald-500/20">
              {student ? student.nombre.charAt(0) : 'M'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-1 backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-amber-300" /> Portal del Estudiante
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                ¡Hola, {student ? student.nombre : currentUser?.nombre}!
              </h1>
              <p className="text-emerald-100/80 text-xs mt-0.5">
                {student?.grado} Grado - Grupo "{student?.grupo}" • Matrícula: <span className="font-mono text-white font-bold">{student?.matricula}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              leftIcon={<QrCode className="w-4 h-4 text-emerald-300" />}
              onClick={() => onNavigate('reports')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Ver Mi Boleta
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Mi Promedio Actual"
          value={currentAverage}
          subtitle={`Trimestre ${activeTrimester}`}
          icon={Award}
          colorVariant="emerald"
          badge={{ text: 'Excelente Desempeño', isPositive: true }}
        />
        <StatCard
          title="Mis Asistencias"
          value={`${student?.asistenciasTotales.presentes || 18} Días`}
          subtitle={`${student?.asistenciasTotales.retardos || 0} retardos • ${student?.asistenciasTotales.faltas || 0} faltas`}
          icon={CalendarCheck}
          colorVariant="indigo"
          badge={{ text: '95% Asistencia', isPositive: true }}
        />
        <StatCard
          title="Materias Registradas"
          value={subjects.length}
          subtitle="Plan Escolar 2026-2027"
          icon={BookOpen}
          colorVariant="sky"
        />
      </div>

      {/* Grades Grid & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Calificaciones y Tareas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Mis Calificaciones - Trimestre {activeTrimester}
              </CardTitle>
            </CardHeader>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {subjects.map((sub) => {
                const score = grades[sub.nombre];
                return (
                  <div key={sub.id} className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                        {sub.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.nombre}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{sub.clave || 'Materia Oficial'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-xl text-sm font-extrabold ${
                        score && score >= 9.0
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                      }`}>
                        {score !== null && score !== undefined ? score : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active Homework and Projects */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Mis Tareas & Proyectos Escolares
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')}>
                Ver Tareas
              </Button>
            </CardHeader>

            <div className="space-y-3">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{task.titulo}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {task.fecha}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Notices & Projects */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Avisos para Alumnos
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 uppercase">
                    {notice.fecha}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{notice.titulo}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{notice.contenido}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Proyectos Formativos
              </CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              {projects.slice(0, 2).map((proj) => (
                <div key={proj.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{proj.titulo}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Entrega: {proj.fecha}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
