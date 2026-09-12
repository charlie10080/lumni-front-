import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  FolderKanban,
  PlusCircle,
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
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

export const ProjectsView: React.FC = () => {
  const { projects, addProject, deleteProject } = useData();
  const { role } = useAuth();
  const isTeacher = role === 'teacher';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [selectedCampos, setSelectedCampos] = useState<string[]>([]);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [estado, setEstado] = useState<'planeacion' | 'desarrollo' | 'concluido'>('desarrollo');

  const toggleCampo = (campo: string) => {
    setSelectedCampos((prev) =>
      prev.includes(campo) ? prev.filter((c) => c !== campo) : [...prev, campo]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fechaEntrega) return;

    addProject({
      titulo: titulo.trim(),
      campos: selectedCampos.length > 0 ? selectedCampos : ['Saberes y Pensamiento Científico'],
      fecha: fechaEntrega,
      desc: instrucciones.trim(),
      estado,
    });

    setTitulo('');
    setSelectedCampos([]);
    setFechaEntrega('');
    setInstrucciones('');
    setEstado('desarrollo');
    setIsModalOpen(false);
  };

  const inDevelopment = projects.filter((p) => p.estado === 'desarrollo' || !p.estado).length;
  const completed = projects.filter((p) => p.estado === 'concluido').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Proyectos Escolares & Formativos
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Planifica, articula y evalúa proyectos integradores vinculados a los Campos Formativos.
          </p>
        </div>

        {isTeacher && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nuevo Proyecto
          </Button>
        )}
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total de Proyectos</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{projects.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">En Desarrollo</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{inDevelopment}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Concluidos</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{completed}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No hay proyectos activos</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {isTeacher
              ? 'Comienza creando el primer proyecto formativo para articular los campos escolares.'
              : 'Tu docente aún no ha publicado proyectos escolares para este periodo.'}
          </p>
          {isTeacher && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Crear Proyecto
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isDueSoon = new Date(proj.fecha) < new Date();

            return (
              <Card key={proj.id} hoverEffect className="flex flex-col justify-between space-y-4 p-5">
                <div>
                  {/* Campos Formativos Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {proj.campos.map((c) => (
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
                    {proj.titulo}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Publicado el {proj.fechaPub}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                    {proj.desc || 'Sin instrucciones adicionales.'}
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Entrega: <strong className="text-slate-900 dark:text-white">{proj.fecha}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDueSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Vencido
                      </span>
                    )}

                    {isTeacher && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Deseas eliminar el proyecto "${proj.titulo}"?`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        title="Eliminar proyecto"
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

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Proyecto Integrador"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título del Proyecto"
            required
            placeholder="Ej. Huerto Escolar Sustentable"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha Límite de Entrega"
              required
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Estado del Proyecto
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="planeacion">En Planeación</option>
                <option value="desarrollo">En Desarrollo</option>
                <option value="concluido">Concluido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Instrucciones / Descripción del Proyecto
            </label>
            <textarea
              rows={3}
              placeholder="Detalla los objetivos, fases de investigación y entregables esperados..."
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
              Publicar Proyecto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
