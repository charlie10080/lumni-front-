import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { StudentIncidentType, StudentIncidentReport } from '../types';
import {
  generateOfficialBoletaPDF,
  exportGradesToExcel,
  exportStudentsToExcel,
  exportAttendanceToExcel,
} from '../services/reportGenerator';
import {
  FileSpreadsheet,
  Printer,
  Download,
  FileText,
  Users,
  CalendarCheck,
  CheckCircle2,
  ShieldAlert,
  Award,
  AlertTriangle,
  PlusCircle,
  Filter,
  Check,
  Clock,
  Trash2,
  Mail,
  UserCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { students, subjects, schoolInfo, activeTrimester, incidentReports, addIncidentReport, deleteIncidentReport, toggleIncidentStatus } = useData();
  const { currentUser, role } = useAuth();
  
  // Tab selector: boletas vs incidencias
  const [activeTab, setActiveTab] = useState<'boletas' | 'incidencias'>('boletas');

  // Boleta State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Incidencias Filter & Modal State
  const [filterIncidentStudent, setFilterIncidentStudent] = useState('todos');
  const [filterIncidentType, setFilterIncidentType] = useState('todos');
  const [filterIncidentStatus, setFilterIncidentStatus] = useState<'todos' | 'pendiente' | 'atendido'>('todos');
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
  const [selectedIncidentForPrint, setSelectedIncidentForPrint] = useState<StudentIncidentReport | null>(null);

  // Form New Incident State
  const [formStudentId, setFormStudentId] = useState(students[0]?.id || '');
  const [formTipo, setFormTipo] = useState<StudentIncidentType>('conducta');
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formGravedad, setFormGravedad] = useState<'baja' | 'media' | 'alta'>('media');
  const [formCompromiso, setFormCompromiso] = useState('');

  // If role is parent, select their specific student
  const parentStudentId = currentUser?.studentId || localStorage.getItem('lumni_parent_student_id');
  const student =
    role === 'parent'
      ? students.find((s) => s.id === parentStudentId || s.curp === parentStudentId || s.matricula === parentStudentId) || students[0]
      : students.find((s) => s.id === selectedStudentId) || students[0];

  const teacherName = currentUser && role === 'teacher'
    ? `${currentUser.nombre} ${currentUser.apellidos || ''}`
    : 'Prof. Carlos Mendoza Morales';

  const triggerSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadPDF = () => {
    if (!student) return;
    generateOfficialBoletaPDF(student, subjects, schoolInfo, teacherName);
    triggerSuccess(`Boleta en PDF de ${student.nombre} descargada con éxito.`);
  };

  const handleExportGradesExcel = (trimester: 1 | 2 | 3 | 'anual') => {
    exportGradesToExcel(students, subjects, schoolInfo, trimester);
    triggerSuccess('Concentrado de Calificaciones en Excel descargado.');
  };

  const handleExportStudentsExcel = () => {
    exportStudentsToExcel(students, schoolInfo);
    triggerSuccess('Padrón de Alumnos en Excel descargado.');
  };

  const handleExportAttendanceExcel = () => {
    exportAttendanceToExcel(students, schoolInfo);
    triggerSuccess('Concentrado de Asistencias en Excel descargado.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Matricula', 'Nombre', 'Apellidos', 'CURP', 'Grado', 'Grupo', 'Promedio T1', 'Promedio T2', 'Asistencias Totales'];
    const rows = students.map((s) => {
      const g1 = Object.values(s.calificacionesTrimestres[1] || {}).filter((v): v is number => typeof v === 'number');
      const avg1 = g1.length ? (g1.reduce((a, b) => a + b, 0) / g1.length).toFixed(1) : '-';

      const g2 = Object.values(s.calificacionesTrimestres[2] || {}).filter((v): v is number => typeof v === 'number');
      const avg2 = g2.length ? (g2.reduce((a, b) => a + b, 0) / g2.length).toFixed(1) : '-';

      return [
        s.matricula,
        `"${s.nombre}"`,
        `"${s.apellidos}"`,
        s.curp,
        s.grado,
        s.grupo,
        avg1,
        avg2,
        s.asistenciasTotales.presentes,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_lumni_${schoolInfo.ciclo.replace('-', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess('Archivo CSV exportado.');
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formDescripcion.trim()) return;

    const targetStudent = students.find((s) => s.id === formStudentId);
    if (!targetStudent) return;

    addIncidentReport({
      studentId: targetStudent.id,
      studentName: `${targetStudent.nombre} ${targetStudent.apellidos}`,
      tipo: formTipo,
      titulo: formTitulo.trim(),
      descripcion: formDescripcion.trim(),
      gravedad: formGravedad,
      compromisoTutor: formCompromiso.trim() || undefined,
      atendido: false,
      docenteNombre: teacherName,
    });

    setFormTitulo('');
    setFormDescripcion('');
    setFormCompromiso('');
    setIsNewIncidentModalOpen(false);
    triggerSuccess(`Reporte registrado con éxito para ${targetStudent.nombre}.`);
  };

  const isTeacher = role === 'teacher';

  // Filtered incidents
  const filteredIncidents = incidentReports.filter((inc) => {
    if (role === 'parent') {
      const isParentChild =
        inc.studentId === student?.id ||
        (student?.nombre && inc.studentName.toLowerCase().includes(student.nombre.toLowerCase()));
      return isParentChild;
    }
    if (filterIncidentStudent !== 'todos' && inc.studentId !== filterIncidentStudent) return false;
    if (filterIncidentType !== 'todos' && inc.tipo !== filterIncidentType) return false;
    if (filterIncidentStatus === 'pendiente' && inc.atendido) return false;
    if (filterIncidentStatus === 'atendido' && !inc.atendido) return false;
    return true;
  });

  // Incident Metrics
  const totalInc = incidentReports.length;
  const totalFelicitaciones = incidentReports.filter((i) => i.tipo === 'felicitacion').length;
  const totalCitatorios = incidentReports.filter((i) => i.tipo === 'citatorio' || i.tipo === 'conducta').length;
  const totalAtendidos = incidentReports.filter((i) => i.atendido).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-app-primary tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-brand" />
            Centro de Reportes, Boletas & Incidencias
          </h1>
          <p className="text-xs text-app-secondary mt-1">
            {isTeacher
              ? 'Gestión integral de boletas de evaluación, sábana grupal y expediente formativo de los alumnos.'
              : 'Consulta tu boleta de calificaciones oficial y el expediente de seguimiento de tu hijo.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {downloadSuccess && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Top Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('boletas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'boletas'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Boletas & Concentrados
            </button>
            <button
              onClick={() => setActiveTab('incidencias')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'incidencias'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Expediente & Incidencias
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold">
                {incidentReports.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BOLETAS & CONCENTRADOS */}
      {activeTab === 'boletas' && (
        <div className="space-y-6">
          {/* Mass Export Quick Action Cards - Only Visible to Teacher */}
          {isTeacher && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Calificaciones Excel */}
              <Card hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-app-primary">Concentrado de Calificaciones</h3>
                    <p className="text-xs text-app-secondary mt-1">
                      Sábana de notas de todo el grupo con promedios y desglose de materias.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-app">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleExportGradesExcel(activeTrimester as 1 | 2 | 3)}
                  >
                    Excel (Trim. {activeTrimester})
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExportGradesExcel('anual')}
                  >
                    Anual
                  </Button>
                </div>
              </Card>

              {/* Card 2: Padrón Alumnos Excel */}
              <Card hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-app-primary">Padrón de Alumnos</h3>
                    <p className="text-xs text-app-secondary mt-1">
                      Lista escolar con CURP, matrícula, grado, grupo y teléfonos de tutores.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-app">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    onClick={handleExportStudentsExcel}
                  >
                    Descargar Padrón (.xlsx)
                  </Button>
                </div>
              </Card>

              {/* Card 3: Concentrado Asistencias */}
              <Card hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-app-primary">Concentrado de Asistencias</h3>
                    <p className="text-xs text-app-secondary mt-1">
                      Reporte de días presentes, retardos, faltas acumuladas y porcentajes.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-app">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    leftIcon={<Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    onClick={handleExportAttendanceExcel}
                  >
                    Descargar Asistencias (.xlsx)
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Individual Boleta Controls Bar */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isTeacher ? (
                  <>
                    <span className="text-xs font-semibold uppercase text-app-muted whitespace-nowrap">
                      Seleccionar Alumno:
                    </span>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full sm:w-80 surface-card border border-app rounded-xl px-3.5 py-2 text-sm text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} {s.apellidos} ({s.matricula})
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <span className="text-sm font-bold text-app-primary">
                    Boleta de Evaluación de {student?.nombre} {student?.apellidos}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="primary"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={handleDownloadPDF}
                >
                  Descargar Boleta (PDF)
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handlePrint}
                >
                  Imprimir
                </Button>
                {isTeacher && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                  >
                    CSV
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Official Boleta Printable Preview Card */}
          {student && (
            <div className="print-boleta-target bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 print:m-0 print:p-4 print:shadow-none">
              {/* Header Membrete */}
              <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                    L
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-indigo-950 uppercase tracking-tight">
                      {schoolInfo.nombre}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">
                      CLAVE C.C.T: {schoolInfo.cct} • CICLO ESCOLAR: {schoolInfo.ciclo}
                    </p>
                    <p className="text-[11px] text-slate-500">{schoolInfo.direccion} • Tel: {schoolInfo.telefono}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded bg-indigo-50 text-indigo-900 text-xs font-bold uppercase tracking-wider border border-indigo-200">
                    Boleta de Evaluación
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Expedición: {new Date().toLocaleDateString('es-MX')}</p>
                </div>
              </div>

              {/* Student Info Grid */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs">
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-[10px]">Nombre del Alumno</p>
                  <p className="font-bold text-slate-900 text-sm">{student.nombre} {student.apellidos}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-[10px]">CURP</p>
                  <p className="font-mono font-bold text-slate-900">{student.curp}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-[10px]">Grado y Grupo</p>
                  <p className="font-bold text-slate-900">{student.grado} Grado - Grupo "{student.grupo}"</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-[10px]">Matrícula</p>
                  <p className="font-mono font-bold text-indigo-900">{student.matricula}</p>
                </div>
              </div>

              {/* Grades Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-indigo-950 text-white uppercase text-[11px] font-bold">
                    <tr>
                      <th className="py-2.5 px-4 border-r border-indigo-900">Asignatura</th>
                      <th className="py-2.5 px-3 text-center border-r border-indigo-900">1er Trimestre</th>
                      <th className="py-2.5 px-3 text-center border-r border-indigo-900">2do Trimestre</th>
                      <th className="py-2.5 px-3 text-center border-r border-indigo-900">3er Trimestre</th>
                      <th className="py-2.5 px-3 text-center">Promedio Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {subjects.map((sub) => {
                      const g1 = student.calificacionesTrimestres[1]?.[sub.nombre] ?? '-';
                      const g2 = student.calificacionesTrimestres[2]?.[sub.nombre] ?? '-';
                      const g3 = student.calificacionesTrimestres[3]?.[sub.nombre] ?? '-';

                      const valid = [g1, g2, g3].filter((g): g is number => typeof g === 'number');
                      const finalAvg = valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : '-';

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="py-2 px-4 border-r border-slate-200 font-semibold">{sub.nombre}</td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">{g1}</td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">{g2}</td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">{g3}</td>
                          <td className="py-2 px-3 text-center font-bold text-indigo-950">{finalAvg}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Attendance Summary & Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
                {/* Asistencias */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">Resumen de Asistencia del Ciclo</h4>
                  <p className="text-slate-600">
                    • Días Presente: <strong className="text-slate-900">{student.asistenciasTotales.presentes}</strong>
                  </p>
                  <p className="text-slate-600">
                    • Retardos Registrados: <strong className="text-slate-900">{student.asistenciasTotales.retardos}</strong>
                  </p>
                  <p className="text-slate-600">
                    • Faltas Registradas: <strong className="text-slate-900">{student.asistenciasTotales.faltas}</strong>
                  </p>
                </div>

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="pt-8 border-t border-slate-400">
                    <p className="font-bold text-slate-900">{teacherName}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Firma del Docente</p>
                  </div>
                  <div className="pt-8 border-t border-slate-400">
                    <p className="font-bold text-slate-900">{schoolInfo.director}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Dirección del Plantel</p>
                  </div>
                </div>
              </div>

              {/* Aviso de No Oficialidad */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  ⚠️ Documento de control interno escolar para seguimiento informativo. No constituye certificación ni boleta oficial gubernamental (SEP).
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                  Plataforma Lumni v2.0 • Folio Interno: LUM-{student.id.toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPEDIENTE DE REPORTES E INCIDENCIAS */}
      {activeTab === 'incidencias' && (
        <div className="space-y-6">
          {/* Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Expedientes</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalInc}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Felicitaciones / Méritos</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totalFelicitaciones}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Award className="w-5 h-5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Citatorios / Conducta</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{totalCitatorios}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Casos Atendidos</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {totalAtendidos} / {totalInc}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
            </Card>
          </div>

          {/* Filter Bar & Action Button */}
          <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Filtros:
              </div>

              {/* Student Filter */}
              {isTeacher && (
                <select
                  value={filterIncidentStudent}
                  onChange={(e) => setFilterIncidentStudent(e.target.value)}
                  className="surface-card border border-app rounded-xl px-3 py-1.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los Alumnos</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.apellidos}
                    </option>
                  ))}
                </select>
              )}

              {/* Type Filter */}
              <select
                value={filterIncidentType}
                onChange={(e) => setFilterIncidentType(e.target.value)}
                className="surface-card border border-app rounded-xl px-3 py-1.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Tipos</option>
                <option value="felicitacion">🌟 Felicitación / Mérito</option>
                <option value="conducta">⚠️ Reporte de Conducta</option>
                <option value="citatorio">📋 Citatorio a Tutor</option>
                <option value="academico">📚 Rezago Académico</option>
                <option value="aviso">ℹ️ Aviso Formativo</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterIncidentStatus}
                onChange={(e) => setFilterIncidentStatus(e.target.value as any)}
                className="surface-card border border-app rounded-xl px-3 py-1.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendiente">Pendientes de Seguimiento</option>
                <option value="atendido">Casos Atendidos</option>
              </select>
            </div>

            {isTeacher && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                onClick={() => setIsNewIncidentModalOpen(true)}
              >
                Nuevo Reporte / Mérito
              </Button>
            )}
          </Card>

          {/* Incident Feed */}
          {filteredIncidents.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No se encontraron reportes con los filtros seleccionados
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTeacher
                  ? 'Puedes registrar un nuevo reporte de conducta, felicitación o citatorio con el botón superior.'
                  : 'No hay incidencias registradas para tu hijo en este periodo.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIncidents.map((inc) => {
                const isFelicitacion = inc.tipo === 'felicitacion';
                const isCitatorio = inc.tipo === 'citatorio';
                const isConducta = inc.tipo === 'conducta';
                const isAcademico = inc.tipo === 'academico';

                return (
                  <Card
                    key={inc.id}
                    hoverEffect
                    className={`p-5 flex flex-col justify-between space-y-4 border-l-4 ${
                      isFelicitacion
                        ? 'border-l-emerald-500'
                        : isCitatorio
                        ? 'border-l-rose-500'
                        : isConducta
                        ? 'border-l-amber-500'
                        : isAcademico
                        ? 'border-l-indigo-500'
                        : 'border-l-slate-400'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Date */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isFelicitacion
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : isCitatorio
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                : isConducta
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                : isAcademico
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                            }`}
                          >
                            {isFelicitacion && <Award className="w-3 h-3" />}
                            {isCitatorio && <Mail className="w-3 h-3" />}
                            {isConducta && <AlertTriangle className="w-3 h-3" />}
                            {isAcademico && <FileText className="w-3 h-3" />}
                            {inc.tipo.toUpperCase()}
                          </span>

                          {inc.gravedad && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                inc.gravedad === 'alta'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : inc.gravedad === 'media'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Gravedad: {inc.gravedad}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {inc.fecha}
                        </span>
                      </div>

                      {/* Student Name */}
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Alumno Evaluado:
                        </p>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {inc.studentName}
                        </h4>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{inc.titulo}</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          {inc.descripcion}
                        </p>
                      </div>

                      {/* Tutor Commitment */}
                      {inc.compromisoTutor && (
                        <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
                          <span className="font-bold block text-[11px] uppercase text-indigo-700 dark:text-indigo-400">
                            🤝 Compromiso / Acuerdo del Tutor:
                          </span>
                          <span className="italic mt-0.5 block">{inc.compromisoTutor}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {isTeacher ? (
                          <button
                            onClick={() => toggleIncidentStatus(inc.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              inc.atendido
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {inc.atendido ? 'Caso Atendido' : 'Marcar Atendido'}
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              inc.atendido
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {inc.atendido ? '✅ Atendido y Resuelto' : '⏳ En Seguimiento'}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400">Por: {inc.docenteNombre}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedIncidentForPrint(inc)}
                        >
                          Ficha Imprimible
                        </Button>

                        {isTeacher && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar reporte "${inc.titulo}"?`)) {
                                deleteIncidentReport(inc.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Eliminar Reporte"
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
        </div>
      )}

      {/* Modal: Registrar Nuevo Reporte / Incidencia */}
      <Modal
        isOpen={isNewIncidentModalOpen}
        onClose={() => setIsNewIncidentModalOpen(false)}
        title="Registrar Reporte o Mérito Formativo"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Alumno Destino *
              </label>
              <select
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full surface-card border border-app rounded-xl p-2.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.apellidos} ({s.matricula})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Registro *
              </label>
              <select
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value as StudentIncidentType)}
                className="w-full surface-card border border-app rounded-xl p-2.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="felicitacion">🌟 Felicitación / Mérito Escolar</option>
                <option value="conducta">⚠️ Reporte de Conducta</option>
                <option value="citatorio">📋 Citatorio a Tutor</option>
                <option value="academico">📚 Rezago Académico</option>
                <option value="aviso">ℹ️ Aviso Formativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Título del Reporte *"
                required
                placeholder="Ej. Felicitación por proyecto / Uso de celular"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Gravedad / Impacto
              </label>
              <select
                value={formGravedad}
                onChange={(e) => setFormGravedad(e.target.value as any)}
                className="w-full surface-card border border-app rounded-xl p-2.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="baja">Baja / Informativo</option>
                <option value="media">Media / Atención</option>
                <option value="alta">Alta / Citatorio Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Descripción de los Hechos u Observaciones *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detalla lo sucedido de manera objetiva y pedagógica..."
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              className="w-full surface-card border border-app rounded-xl p-3 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Compromiso del Tutor / Acuerdo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. El padre se compromete a supervisar las tareas diariamente..."
              value={formCompromiso}
              onChange={(e) => setFormCompromiso(e.target.value)}
              className="w-full surface-card border border-app rounded-xl p-2.5 text-xs text-app-primary focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-app">
            <Button variant="secondary" size="sm" onClick={() => setIsNewIncidentModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Check className="w-4 h-4" />}>
              Guardar Reporte
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ficha / Citatorio Imprimible */}
      {selectedIncidentForPrint && (
        <Modal
          isOpen={!!selectedIncidentForPrint}
          onClose={() => setSelectedIncidentForPrint(null)}
          title="Ficha Oficial de Incidencia / Citatorio"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 space-y-4 shadow-sm text-xs print-credential-target">
              {/* Header */}
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase text-indigo-950">{schoolInfo.nombre}</h3>
                  <p className="text-[10px] text-slate-500">C.C.T: {schoolInfo.cct} • CICLO: {schoolInfo.ciclo}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border text-[10px]">
                    {selectedIncidentForPrint.tipo.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fecha: {selectedIncidentForPrint.fecha}</p>
                </div>
              </div>

              {/* Student info */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border text-[11px]">
                <p><strong>Alumno:</strong> {selectedIncidentForPrint.studentName}</p>
                <p><strong>Docente Titular:</strong> {selectedIncidentForPrint.docenteNombre}</p>
              </div>

              {/* Narrative */}
              <div>
                <p className="font-bold text-slate-800 text-xs">{selectedIncidentForPrint.titulo}</p>
                <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                  {selectedIncidentForPrint.descripcion}
                </p>
              </div>

              {selectedIncidentForPrint.compromisoTutor && (
                <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200">
                  <p className="font-bold text-indigo-950 text-[10px] uppercase">Acuerdo y Compromiso:</p>
                  <p className="italic text-indigo-900 mt-0.5">{selectedIncidentForPrint.compromisoTutor}</p>
                </div>
              )}

              {/* Signature lines */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-[10px]">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">{selectedIncidentForPrint.docenteNombre}</p>
                  <p className="text-slate-500">Docente Titular</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">Firma del Padre / Tutor</p>
                  <p className="text-slate-500">Enterado y Conforme</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">{schoolInfo.director}</p>
                  <p className="text-slate-500">Dirección</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-app">
              <Button variant="secondary" size="sm" onClick={() => setSelectedIncidentForPrint(null)}>
                Cerrar
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
                Imprimir Documento
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
