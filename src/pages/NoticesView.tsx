import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  Bell,
  PlusCircle,
  Calendar,
  User,
  Trash2,
  Send,
  Search,
  Filter,
} from 'lucide-react';
import { NoticeAudience, NoticePriority } from '../types';

export const NoticesView: React.FC = () => {
  const { notices, addNotice, deleteNotice } = useData();
  const { currentUser, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    audiencia: 'todos' as NoticeAudience,
    prioridad: 'media' as NoticePriority,
    destacado: false,
  });

  const filteredNotices = notices.filter((n) => {
    if (audienceFilter !== 'todos' && n.audiencia !== audienceFilter) return false;
    const full = `${n.titulo} ${n.contenido} ${n.autor}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const authorName = currentUser ? `${currentUser.nombre} ${currentUser.apellidos || ''}` : 'Personal Docente';
    addNotice({
      ...formData,
      autor: authorName,
      rolAutor: role === 'teacher' ? 'Docente Titular' : 'Dirección Escolar',
    });
    setFormData({
      titulo: '',
      contenido: '',
      audiencia: 'todos',
      prioridad: 'media',
      destacado: false,
    });
    setIsModalOpen(false);
  };

  const getPriorityBadge = (p: NoticePriority) => {
    switch (p) {
      case 'urgente':
      case 'alta':
        return <Badge variant="danger">⚠️ {p.toUpperCase()}</Badge>;
      case 'media':
        return <Badge variant="warning">Prioridad Media</Badge>;
      case 'baja':
        return <Badge variant="default">Informativo</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            Mural de Avisos & Comunicados Escolares
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tablón oficial de noticias institucionales, circulares y recordatorios para la comunidad escolar.
          </p>
        </div>

        {role === 'teacher' && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Publicar Aviso
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Buscar avisos por título o contenido..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Audiencia:</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="todos">Todos los Destinatarios</option>
              <option value="padres">Padres de Familia</option>
              <option value="profesores">Profesores</option>
              <option value="alumnos">Alumnos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notices Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotices.map((notice) => (
          <Card key={notice.id} hoverEffect className="flex flex-col justify-between">
            <div>
              {/* Card Meta Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 uppercase">
                    {notice.audiencia}
                  </span>
                  {getPriorityBadge(notice.prioridad)}
                </div>

                {role === 'teacher' && (
                  <button
                    onClick={() => deleteNotice(notice.id)}
                    title="Eliminar aviso"
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Title & Body */}
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                {notice.titulo}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {notice.contenido}
              </p>
            </div>

            {/* Footer Author & Date */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span className="truncate font-medium text-slate-700 dark:text-slate-300">{notice.autor}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{notice.fecha}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Comunicado Escolar"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título del Comunicado"
            required
            placeholder="Ej. Junta informativa de evaluación trimestral"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Contenido del Mensaje
            </label>
            <textarea
              required
              rows={4}
              placeholder="Escribe los detalles del aviso, instrucciones o fechas importantes..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Destinatarios
              </label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.audiencia}
                onChange={(e) => setFormData({ ...formData, audiencia: e.target.value as any })}
              >
                <option value="todos">Toda la Comunidad (General)</option>
                <option value="padres">Solo Padres de Familia</option>
                <option value="profesores">Solo Profesores</option>
                <option value="alumnos">Solo Alumnos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nivel de Prioridad
              </label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
              >
                <option value="baja">Informativa / Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Send className="w-4 h-4" />}>
              Publicar Comunicado
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
