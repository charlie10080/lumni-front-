import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  CheckSquare,
  PlusCircle,
  Calendar,
  Clock,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const CAMPOS_FORMATIVOS = [
  'Lenguajes',
  'Saberes y Pensamiento Científico',
  'Ética, Naturaleza y Sociedades',
  'De lo Humano y lo Comunitario',
];

const CAMPO_COLORS: Record<string, string> = {
  'Lenguajes': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  'Saberes y Pensamiento Científico': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  'Ética, Naturaleza y Sociedades': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'De lo Humano y lo Comunitario': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
};

export const TasksView: React.FC = () => {
  const { tasks, addTask, deleteTask } = useData();
  const { role } = useAuth();
  const isTeacher = role === 'teacher';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [selectedCampos, setSelectedCampos] = useState<string[]>([]);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  const toggleCampo = (campo: string) => {
    setSelectedCampos((prev) =>
      prev.includes(campo) ? prev.filter((c) => c !== campo) : [...prev, campo]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fechaEntrega) return;

    addTask({
      titulo: titulo.trim(),
      campos: selectedCampos.length > 0 ? selectedCampos : ['Saberes y Pensamiento Científico'],
      fecha: fechaEntrega,
      desc: instrucciones.trim(),
      estado: 'pendiente',
    });

    setTitulo('');
    setSelectedCampos([]);
    setFechaEntrega('');
    setInstrucciones('');
    setIsModalOpen(false);
  };

  const pendingTasks = tasks.filter((t) => t.estado === 'pendiente' || !t.estado).length;
  const completedTasks = tasks.filter((t) => t.estado === 'entregada' || t.estado === 'revisada').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Tareas y Asignaciones Escolares
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Asigna y supervisa actividades para casa vinculando Campos Formativos y fechas de entrega.
          </p>
        </div>

        {isTeacher && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total de Tareas</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{tasks.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pendientes</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{pendingTasks}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Entregadas</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{completedTasks}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No hay tareas escolares activas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {isTeacher
              ? 'Asigna la primera tarea para que los alumnos y tutores puedan consultarla.'
              : '¡Excelente! No tienes tareas pendientes asignadas en este momento.'}
          </p>
          {isTeacher && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Crear Tarea
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const isDueSoon = new Date(task.fecha) < new Date();

            return (
              <Card key={task.id} hoverEffect className="flex flex-col justify-between space-y-4 p-5">
                <div>
                  {/* Campos Formativos Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {task.campos.map((c) => (
                      <span
                        key={c}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                          CAMPO_COLORS[c] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {task.titulo}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-indigo-400" /> Asignada el {task.fechaPub}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                    {task.desc || 'Sin instrucciones adicionales.'}
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Entrega: <strong className="text-slate-900 dark:text-white">{task.fecha}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDueSoon ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Revisión
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        Vigente
                      </span>
                    )}

                    {isTeacher && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Deseas eliminar la tarea "${task.titulo}"?`)) {
                            deleteTask(task.id);
                          }
                        }}
                        title="Eliminar tarea"
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Tarea Escolar"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título de la Tarea"
            required
            placeholder="Ej. Ejercicios de Fracciones y Reparto"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Campos Formativos Articulados (Selecciona los aplicables):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CAMPOS_FORMATIVOS.map((campo) => {
                const isChecked = selectedCampos.includes(campo);
                return (
                  <button
                    type="button"
                    key={campo}
                    onClick={() => toggleCampo(campo)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition flex items-center gap-2 cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>{campo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            type="date"
            label="Fecha Límite de Entrega"
            required
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Instrucciones / Ejercicios a Realizar
            </label>
            <textarea
              rows={3}
              placeholder="Páginas del libro, temas a repasar o especificaciones del cuaderno..."
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Asignar Tarea
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
