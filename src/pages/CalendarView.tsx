import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { CalendarEventType } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarView: React.FC = () => {
  const { calendarEvents, projects, tasks, addCalendarEvent, deleteCalendarEvent } = useData();
  const { role } = useAuth();
  const isTeacher = role === 'teacher';

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<CalendarEventType>('evento');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fecha) return;

    addCalendarEvent({
      titulo: titulo.trim(),
      tipo,
      fecha,
      descripcion: descripcion.trim(),
    });

    setTitulo('');
    setTipo('evento');
    setFecha('');
    setDescripcion('');
    setIsModalOpen(false);
  };

  // Calendar calculations
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const getEventBadgeClass = (type: CalendarEventType | 'proyecto' | 'tarea') => {
    switch (type) {
      case 'evaluacion':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'entrega':
      case 'proyecto':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'tarea':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'suspension':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Selector and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Calendario Escolar & Fechas Clave
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Visualiza eventos institucionales, entregas de proyectos, tareas y suspensiones del ciclo escolar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-slate-900 dark:text-white min-w-[120px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleToday}>
            Hoy
          </Button>

          {isTeacher && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Nuevo Evento
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <Card className="p-3.5 flex items-center gap-3 flex-wrap text-xs font-semibold">
        <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Categorías:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-700 dark:text-slate-300">Evaluación</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-700 dark:text-slate-300">Entrega / Proyecto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-slate-700 dark:text-slate-300">Tarea</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="text-slate-700 dark:text-slate-300">Evento General</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-700 dark:text-slate-300">Suspensión / CTE</span>
        </div>
      </Card>

      {/* Calendar Grid Container */}
      <Card className="p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            {DAY_NAMES.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="p-2 min-h-[90px] rounded-2xl bg-transparent" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;

              // Matching items
              const dayEvents = calendarEvents.filter((e) => e.fecha === dateStr);
              const dayProjects = projects.filter((p) => p.fecha === dateStr);
              const dayTasks = tasks.filter((t) => t.fecha === dateStr);

              return (
                <div
                  key={day}
                  className={`p-2 min-h-[100px] rounded-2xl border transition flex flex-col justify-between ${
                    isToday
                      ? 'bg-indigo-500/10 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-400/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-extrabold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-tight text-indigo-600 dark:text-indigo-400">
                        Hoy
                      </span>
                    )}
                  </div>

                  {/* Day Events Container */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border truncate flex items-center justify-between group ${getEventBadgeClass(
                          ev.tipo
                        )}`}
                        title={`${ev.titulo} (${ev.tipo}) - ${ev.descripcion || ''}`}
                      >
                        <span className="truncate">{ev.titulo}</span>
                        {isTeacher && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar evento "${ev.titulo}"?`)) {
                                deleteCalendarEvent(ev.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 pl-1 shrink-0 cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {dayProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border truncate ${getEventBadgeClass(
                          'proyecto'
                        )}`}
                        title={`Entrega de Proyecto: ${proj.titulo}`}
                      >
                        📁 P: {proj.titulo}
                      </div>
                    ))}

                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border truncate ${getEventBadgeClass(
                          'tarea'
                        )}`}
                        title={`Entrega de Tarea: ${task.titulo}`}
                      >
                        📝 T: {task.titulo}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Create Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agendar Evento Escolar"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título del Evento"
            required
            placeholder="Ej. Junta Informativa de Padres, Examen de Español"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Tipo de Evento
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as CalendarEventType)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="evento">Evento General</option>
                <option value="evaluacion">Evaluación / Examen</option>
                <option value="entrega">Entrega Escolar</option>
                <option value="suspension">Suspensión de Labores / CTE</option>
              </select>
            </div>

            <Input
              type="date"
              label="Fecha del Evento"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Descripción / Observaciones (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalles del horario, material requerido o indicaciones para alumnos y tutores..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Guardar Evento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
