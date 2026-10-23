import React from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { AttendanceBadge } from '../components/ui/Badge';

/** Asistencia del hijo(a), solo lectura. Los padres no pasan lista. */
export const ParentAttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const { students } = useData();

  const parentStudentId = currentUser?.studentId || localStorage.getItem('lumni_parent_student_id');
  const student = students.find((s) => s.id === parentStudentId || s.curp === parentStudentId);

  if (!student) {
    return <p className="p-12 text-center text-sm text-app-muted">No se encontró el registro de asistencia del alumno.</p>;
  }

  const days = Object.entries(student.asistenciasPorFecha || {}).sort(([a], [b]) => b.localeCompare(a));
  const totals = student.asistenciasTotales || { presentes: 0, retardos: 0, faltas: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <CalendarCheck2 className="w-6 h-6 text-emerald-500" />
        <div>
          <h1 className="text-xl font-bold text-app-primary">Asistencia de {student.nombre}</h1>
          <p className="text-xs text-app-muted">Registro diario capturado por el docente.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Asistencias', totals.presentes, 'text-emerald-500'],
          ['Retardos', totals.retardos, 'text-amber-500'],
          ['Faltas', totals.faltas, 'text-rose-500'],
        ].map(([label, value, color]) => (
          <Card key={label as string} className="p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] uppercase tracking-wider text-app-muted font-bold mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
        {days.length === 0 && <p className="p-6 text-center text-sm text-app-muted">Aún no hay registros.</p>}
        {days.map(([fecha, rec]) => (
          <div key={fecha} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-app-primary">
                {new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-app-muted">{rec.hora && rec.hora !== '--:--' ? `Entrada ${rec.hora}` : 'Sin hora registrada'}</p>
            </div>
            <AttendanceBadge status={rec.status} />
          </div>
        ))}
      </Card>
    </div>
  );
};
