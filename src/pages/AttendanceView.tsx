import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LiveQrScanner } from '../components/attendance/LiveQrScanner';
import { Modal } from '../components/ui/Modal';
import { AttendanceStatus } from '../types';
import {
  CalendarCheck2,
  QrCode,
  Calendar,
  Check,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { students, setAttendance, setBulkAttendance } = useData();
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [filterGrado, setFilterGrado] = useState('todos');
  const [filterGrupo, setFilterGrupo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'todos'>('todos');
  const [lastScannedStudent, setLastScannedStudent] = useState<string | null>(null);

  // Weekday navigation helpers
  const adjustWeekday = (dateStr: string, direction: -1 | 1): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    
    d.setDate(d.getDate() + direction);
    // If Saturday (6), go to Friday (-1) or Monday (+2)
    if (d.getDay() === 6) {
      d.setDate(d.getDate() + (direction === 1 ? 2 : -1));
    }
    // If Sunday (0), go to Friday (-2) or Monday (+1)
    else if (d.getDay() === 0) {
      d.setDate(d.getDate() + (direction === 1 ? 1 : -2));
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayFormatted = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayFormatted}`;
  };

  const goToPreviousWeekday = () => setSelectedDate((prev) => adjustWeekday(prev, -1));
  const goToNextWeekday = () => setSelectedDate((prev) => adjustWeekday(prev, 1));
  const goToToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);

  const formatFriendlyDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filter students by Grade & Group
  const baseStudents = students.filter((s) => {
    if (filterGrado !== 'todos' && s.grado !== filterGrado) return false;
    if (filterGrupo !== 'todos' && s.grupo !== filterGrupo) return false;
    return true;
  });

  // Calculate stats for selected date
  let presentes = 0;
  let retardos = 0;
  let faltas = 0;
  let justificadas = 0;
  let pendientes = 0;

  baseStudents.forEach((s) => {
    const rec = s.asistenciasPorFecha[selectedDate];
    if (rec?.status === 'presente') presentes++;
    else if (rec?.status === 'retardo') retardos++;
    else if (rec?.status === 'falta') faltas++;
    else if (rec?.status === 'justificada') justificadas++;
    else pendientes++;
  });

  const percentAttendance =
    baseStudents.length > 0 ? Math.round((presentes / baseStudents.length) * 100) : 0;

  // Filter by Status Tab
  const displayStudents = baseStudents.filter((s) => {
    if (filterStatus === 'todos') return true;
    const rec = s.asistenciasPorFecha[selectedDate];
    const st = rec?.status || 'pendiente';
    return st === filterStatus;
  });

  const handleScanDecoded = (decodedText: string) => {
    const cleanText = decodedText.trim().toLowerCase();
    const matched = students.find(
      (s) =>
        s.matricula.toLowerCase() === cleanText ||
        s.id.toLowerCase() === cleanText ||
        s.curp.toLowerCase() === cleanText
    );

    if (matched) {
      setAttendance(matched.id, selectedDate, 'presente');
      setLastScannedStudent(`${matched.nombre} ${matched.apellidos} (${matched.matricula})`);
      setTimeout(() => setLastScannedStudent(null), 4000);
    }
  };

  const handleSimulateQrScan = (studentId: string, studentName: string) => {
    setAttendance(studentId, selectedDate, 'presente');
    setLastScannedStudent(studentName);
    setTimeout(() => {
      setLastScannedStudent(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Control Diario de Asistencias & Pase con QR
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Registro ágil en tiempo real con cámara en vivo, navegación de días hábiles y métricas de asistencia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<QrCode className="w-4 h-4" />}
            onClick={() => setIsQrModalOpen(true)}
          >
            Abrir Lector QR en Vivo
          </Button>
        </div>
      </div>

      {/* Weekday Date Navigation & Metrics Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Date Navigator Card */}
        <Card className="p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Día Escolar
            </label>
            <button
              onClick={goToToday}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Hoy
            </button>
          </div>

          {/* Date Picker with Prev/Next buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPreviousWeekday}
              title="Día hábil anterior"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />

            <button
              onClick={goToNextWeekday}
              title="Día hábil siguiente"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
            {formatFriendlyDate(selectedDate)}
          </p>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Presentes Hoy</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{presentes}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{percentAttendance}% del total</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Check className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Retardos / Faltas</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{retardos} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">ret</span> / {faltas} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">fal</span></p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{justificadas} justificada(s)</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Acción Masiva</p>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            onClick={() => setBulkAttendance(selectedDate, 'presente')}
          >
            Marcar Todos Presentes
          </Button>
        </Card>
      </div>

      {/* Filter Options & Quick Status Pills */}
      <Card className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Grupo:
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Grado:</span>
            <select
              value={filterGrado}
              onChange={(e) => setFilterGrado(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="todos">Todos los Grados</option>
              <option value="1°">1er Grado</option>
              <option value="2°">2do Grado</option>
              <option value="3°">3er Grado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Grupo:</span>
            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="todos">Todos los Grupos</option>
              <option value="A">Grupo A</option>
              <option value="B">Grupo B</option>
              <option value="C">Grupo C</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'todos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({baseStudents.length})
          </button>
          <button
            onClick={() => setFilterStatus('presente')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'presente'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Presentes ({presentes})
          </button>
          <button
            onClick={() => setFilterStatus('retardo')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'retardo'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            Retardos ({retardos})
          </button>
          <button
            onClick={() => setFilterStatus('falta')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'falta'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Faltas ({faltas})
          </button>
          <button
            onClick={() => setFilterStatus('justificada')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'justificada'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
            }`}
          >
            Justif. ({justificadas})
          </button>
          <button
            onClick={() => setFilterStatus('pendiente')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterStatus === 'pendiente'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Sin Registro ({pendientes})
          </button>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 m-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Lista del Grupo • Fecha: <span className="text-indigo-600 dark:text-indigo-400">{selectedDate}</span>
          </CardTitle>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando {displayStudents.length} de {baseStudents.length} alumnos
          </span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Alumno</th>
                <th className="py-3.5 px-4">Hora Entrada</th>
                <th className="py-3.5 px-4 text-center">Estado de Asistencia</th>
                <th className="py-3.5 px-4 text-right">Historial Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                    No hay alumnos con el estado de asistencia seleccionado para esta fecha.
                  </td>
                </tr>
              ) : (
                displayStudents.map((student) => {
                  const record = student.asistenciasPorFecha[selectedDate];
                  const currentStatus = record?.status || 'pendiente';
                  const hora = record?.hora || '--:--';

                return (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                        {student.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{student.nombre} {student.apellidos}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{student.matricula} • {student.grado} {student.grupo}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {hora}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => setAttendance(student.id, selectedDate, 'presente')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'presente'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          ✓ Presente
                        </button>

                        <button
                          onClick={() => setAttendance(student.id, selectedDate, 'retardo')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'retardo'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          ⏳ Retardo
                        </button>

                        <button
                          onClick={() => setAttendance(student.id, selectedDate, 'falta')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'falta'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          ✕ Falta
                        </button>

                        <button
                          onClick={() => setAttendance(student.id, selectedDate, 'justificada')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'justificada'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          📄 Justif.
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{student.asistenciasTotales.presentes}P</span> •{' '}
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{student.asistenciasTotales.retardos}R</span> •{' '}
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{student.asistenciasTotales.faltas}F</span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Live QR Scanner Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Escáner QR de Asistencia Escolar en Tiempo Real"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <LiveQrScanner
            onScanSuccess={handleScanDecoded}
            lastScannedStudent={lastScannedStudent}
          />

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              O simula un escaneo rápido de credencial con 1 clic:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {students.map((student) => (
                <Button
                  key={student.id}
                  variant="secondary"
                  size="sm"
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  onClick={() => handleSimulateQrScan(student.id, `${student.nombre} ${student.apellidos}`)}
                  className="justify-start truncate text-left"
                >
                  <span className="truncate">{student.nombre} ({student.matricula})</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
