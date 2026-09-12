import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageSquare, Send, CheckCheck, UserCheck, ShieldCheck, Phone } from 'lucide-react';

export const MessagesView: React.FC = () => {
  const { threads, students, sendMessage } = useData();
  const { currentUser, role } = useAuth();
  
  // Buscar alumno asociado al tutor si es rol parent
  const parentStudentId = currentUser?.studentId || localStorage.getItem('lumni_parent_student_id');
  const currentStudent =
    students.find((s) => s.id === parentStudentId || s.curp === parentStudentId || s.matricula === parentStudentId) ||
    students[0];

  // Estado para la vista de Maestro (inbox con todos los hilos)
  const [activeThreadId, setActiveThreadId] = useState(threads[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Hilos filtrados para el maestro
  const filteredThreads = threads.filter((t) => {
    const full = `${t.studentNombre} ${t.tutorNombre} ${t.ultimoMensaje}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  // Determinar hilo activo:
  // Si es padre de familia, SIEMPRE es el hilo de su hijo
  const parentThread =
    threads.find((t) => t.studentId === currentStudent?.id || t.id === `th_${currentStudent?.id}`) || {
      id: `th_${currentStudent?.id || 'demo'}`,
      studentId: currentStudent?.id || '',
      studentNombre: `${currentStudent?.nombre || 'Alumno'} ${currentStudent?.apellidos || ''}`.trim(),
      tutorNombre: currentUser?.nombre || currentStudent?.tutorNombre || 'Tutor',
      tutorTelefono: currentStudent?.tutorTelefono || '(55) 8432-9011',
      teacherNombre: 'Docente Titular',
      ultimoMensaje: 'Canal directo de comunicación escolar iniciado.',
      ultimaFecha: 'Hoy',
      mensajesNoLeidos: 0,
      mensajes: [
        {
          id: 'init_msg_1',
          remitente: 'teacher',
          texto: `Estimado(a) ${currentUser?.nombre || 'Tutor'}: Este es el canal directo de comunicación con la escuela respecto a su hijo(a) ${currentStudent?.nombre}. Cualquier duda o justificación de falta, puede escribirnos por aquí.`,
          timestamp: '08:00 AM',
          leido: true,
        },
      ],
    };

  const activeThread =
    role === 'parent'
      ? parentThread
      : threads.find((t) => t.id === activeThreadId) || filteredThreads[0] || threads[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const sender = role === 'parent' ? 'parent' : 'teacher';
    sendMessage(activeThread.id, replyText.trim(), sender, {
      studentId: currentStudent?.id || activeThread.studentId,
      studentNombre: activeThread.studentNombre,
      tutorNombre: activeThread.tutorNombre,
      tutorTelefono: activeThread.tutorTelefono,
    });
    setReplyText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {role === 'parent' ? 'Chat Directo con el Docente' : 'Bandeja de Mensajería Escolar'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {role === 'parent'
              ? `Canal privado y seguro para el seguimiento de tu hijo(a) ${currentStudent?.nombre} ${currentStudent?.apellidos}.`
              : 'Canal directo entre docentes y familias para el seguimiento pedagógico y justificaciones.'}
          </p>
        </div>

        {role === 'parent' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Canal Privado y Cifrado</span>
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* VISTA PARA PADRE DE FAMILIA: CHAT 1-ON-1 AISLADO */}
      {/* ======================================================= */}
      {role === 'parent' ? (
        <Card className="p-0 flex flex-col h-[600px] overflow-hidden max-w-4xl mx-auto shadow-xl">
          {/* Header del Chat con el Docente */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Prof. Titular ({currentStudent?.grado} Grado - Grupo "{currentStudent?.grupo}")
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Alumno: <strong className="text-slate-800 dark:text-slate-200">{currentStudent?.nombre} {currentStudent?.apellidos}</strong> • CURP: <span className="font-mono">{currentStudent?.curp}</span>
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tel. Colegio: (55) 8432-9011</span>
            </div>
          </div>

          {/* Mensajes del Chat */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {activeThread.mensajes.map((msg) => {
              const isMe = msg.remitente === 'parent';

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 text-xs shadow-sm ${
                      isMe
                        ? 'bg-amber-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                    }`}
                  >
                    <p className="font-semibold text-[10px] opacity-80 mb-1">
                      {isMe ? `Tú (${currentUser?.nombre || 'Tutor'})` : 'Profesor Titular'}
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] opacity-75">
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-amber-200" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input para Enviar Mensaje */}
          <form onSubmit={handleSend} className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Escribe un mensaje para el maestro de ${currentStudent?.nombre}...`}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white"
              rightIcon={<Send className="w-4 h-4" />}
            >
              Enviar
            </Button>
          </form>
        </Card>
      ) : (
        /* ======================================================= */
        /* VISTA PARA MAESTRO: INBOX COMPLETO DE ALUMNOS / TUTORES */
        /* ======================================================= */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Left Col: Threads List */}
          <Card className="p-0 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Conversaciones con Tutores</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por alumno o tutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredThreads.map((t) => {
                const isSelected = t.id === activeThread?.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full text-left p-4 transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/15 border-l-4 border-indigo-600 dark:border-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-slate-700 shrink-0">
                      {t.studentNombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.studentNombre}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.ultimaFecha.split(' ')[1] || ''}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mb-1">
                        Tutor: {t.tutorNombre}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{t.ultimoMensaje}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Right Col: Active Conversation View */}
          {activeThread ? (
            <Card className="md:col-span-2 p-0 flex flex-col h-full overflow-hidden">
              {/* Header of Active Chat */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                    {activeThread.studentNombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeThread.studentNombre}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Tutor: {activeThread.tutorNombre} • Tel: {activeThread.tutorTelefono}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
                {activeThread.mensajes.map((msg) => {
                  const isMe = msg.remitente === 'teacher';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.texto}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send Message Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje para el tutor del alumno..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <Button type="submit" variant="primary" size="sm" rightIcon={<Send className="w-4 h-4" />}>
                  Enviar
                </Button>
              </form>
            </Card>
          ) : (
            <div className="md:col-span-2 flex items-center justify-center text-slate-500 dark:text-slate-400">
              Selecciona una conversación para comenzar.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

