import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AttendanceBadge } from '../components/ui/Badge';
import {
  Users,
  CalendarCheck,
  Award,
  Bell,
  Sparkles,
  QrCode,
  GraduationCap,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  UserPlus,
  PlusCircle,
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { students, notices } = useData();

  // Métricas
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.activo).length;

  // Asistencia de hoy (último día registrado o fecha actual)
  const todayStr = new Date().toISOString().split('T')[0];
  const presentCount = students.filter(
    (s) => s.asistenciasPorFecha[todayStr]?.status === 'presente' || s.asistenciasPorFecha['2026-09-11']?.status === 'presente'
  ).length;

  const attendancePercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Promedio general de grupo (Trimestre 1)
  let sumGrades = 0;
  let countGrades = 0;
  students.forEach((s) => {
    const grades = s.calificacionesTrimestres[1] || {};
    Object.values(grades).forEach((g) => {
      if (typeof g === 'number') {
        sumGrades += g;
        countGrades++;
      }
    });
  });
  const groupAverage = countGrades > 0 ? (sumGrades / countGrades).toFixed(1) : '--';

  const userName = currentUser?.nombre || 'Docente';
  const userGroup = currentUser?.grupo || '3er Grado - Grupo B';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-950 border border-indigo-500/20 p-6 lg:p-8 text-white shadow-lg shadow-indigo-950/20">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Plataforma Inteligente Lumni Activa</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              ¡Bienvenido, {userName}!
            </h1>
            <p className="text-indigo-100/80 text-sm mt-1 max-w-xl leading-relaxed">
              {role === 'teacher' && `Panel de control para ${userGroup}. Monitorea asistencias en tiempo real, calificaciones y avisos.`}
              {role === 'parent' && 'Seguimiento escolar del alumno: consulta asistencias diarias y calificaciones oficiales.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role === 'teacher' && (
              <>
                {totalStudents === 0 ? (
                  <Button
                    variant="primary"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    onClick={() => onNavigate('students')}
                  >
                    Agregar Alumnos
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      leftIcon={<QrCode className="w-4 h-4" />}
                      onClick={() => onNavigate('attendance')}
                    >
                      Pase de Lista QR
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon={<GraduationCap className="w-4 h-4" />}
                      onClick={() => onNavigate('grades')}
                    >
                      Capturar Notas
                    </Button>
                  </>
                )}
              </>
            )}
            {role === 'parent' && (
              <Button
                variant="primary"
                leftIcon={<GraduationCap className="w-4 h-4" />}
                onClick={() => onNavigate('grades')}
              >
                Ver Boleta Actual
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Alumnos Registrados"
          value={activeStudents}
          subtitle={`de ${currentUser?.maxAlumnos || 50} cupos activos`}
          icon={Users}
          colorVariant="indigo"
          badge={totalStudents > 0 ? { text: 'Expedientes al día', isPositive: true } : { text: 'Aula nueva', isPositive: true }}
        />
        <StatCard
          title="Asistencia Reciente"
          value={totalStudents > 0 ? `${attendancePercent}%` : '--'}
          subtitle={totalStudents > 0 ? `${presentCount} presentes en la última sesión` : 'Sin sesiones registradas'}
          icon={CalendarCheck}
          colorVariant="emerald"
          badge={totalStudents > 0 ? { text: 'Lista activa', isPositive: true } : { text: 'Por iniciar', isPositive: false }}
        />
        <StatCard
          title="Promedio General"
          value={groupAverage}
          subtitle="Primer Trimestre 2026-2027"
          icon={Award}
          colorVariant="amber"
          badge={countGrades > 0 ? { text: 'Notas capturadas', isPositive: true } : { text: 'Sin calificaciones', isPositive: false }}
        />
        <StatCard
          title="Avisos Publicados"
          value={notices.length}
          subtitle="Comunicados activos del plantel"
          icon={Bell}
          colorVariant="sky"
          badge={notices.length > 0 ? { text: 'Comunidad informada', isPositive: true } : { text: '0 comunicados', isPositive: false }}
        />
      </div>

      {/* Main Sections: Students Attendance Quick List & Recent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Resumen de Asistencia y Calificaciones */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Estado del Grupo ({userGroup})
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Resumen de asistencias y promedios por alumno
                </p>
              </div>
              {totalStudents > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => onNavigate('students')}
                >
                  Ver Lista Completa
                </Button>
              )}
            </CardHeader>

            {totalStudents === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tu aula escolar está lista
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Agrega a tus alumnos o importa tu lista escolar para comenzar a registrar asistencias y generar boletas de evaluación.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                    onClick={() => onNavigate('students')}
                  >
                    Registrar Mi Primer Alumno
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-3">Alumno</th>
                      <th className="py-3 px-3">CURP</th>
                      <th className="py-3 px-3 text-center">Asistencias</th>
                      <th className="py-3 px-3 text-center">Último Estado</th>
                      <th className="py-3 px-3 text-right">Promedio T1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {students.slice(0, 4).map((student) => {
                      const gradesObj = student.calificacionesTrimestres[1] || {};
                      const scores = Object.values(gradesObj).filter((g): g is number => typeof g === 'number');
                      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
                      const lastStatus = student.asistenciasPorFecha[todayStr]?.status || student.asistenciasPorFecha['2026-09-11']?.status || 'pendiente';

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3 font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                              {student.nombre.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{student.nombre} {student.apellidos}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{student.matricula}</p>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                            {student.curp.slice(0, 10)}...
                          </td>
                          <td className="py-3 px-3 text-center text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{student.asistenciasTotales.presentes}P</span> /{' '}
                            <span className="text-amber-600 dark:text-amber-400 font-bold">{student.asistenciasTotales.retardos}R</span> /{' '}
                            <span className="text-rose-600 dark:text-rose-400 font-bold">{student.asistenciasTotales.faltas}F</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <AttendanceBadge status={lastStatus} />
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-bold text-xs">
                              {avg}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Avisos Escolares Recientes */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Avisos Recientes
              </CardTitle>
              {notices.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('notices')}
                >
                  Ver Todos
                </Button>
              )}
            </CardHeader>

            {notices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p>No hay comunicados publicados aún.</p>
                {role === 'teacher' && (
                  <button
                    onClick={() => onNavigate('notices')}
                    className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 hover:underline cursor-pointer"
                  >
                    + Publicar Primer Comunicado
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 3).map((notice) => (
                  <div
                    key={notice.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30 uppercase">
                        {notice.audiencia}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{notice.fecha}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{notice.titulo}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{notice.contenido}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick PDF & Report Export Banner */}
          <Card className="bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Generación de Boletas</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Descarga boletas oficiales con formato membretado y concentrados para dirección en un clic.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNavigate('reports')}
            >
              Ir al Módulo de Reportes
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
