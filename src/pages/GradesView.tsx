import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { downloadGradesExcelTemplate, generateOfficialBoletaPDF } from '../services/reportGenerator';
import {
  GraduationCap,
  Calculator,
  Award,
  TrendingUp,
  AlertTriangle,
  Filter,
  BookPlus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  FileCheck,
  ChevronDown,
  Check,
} from 'lucide-react';

export const GradesView: React.FC = () => {
  const { students, subjects, schoolInfo, activeTrimester, setActiveTrimester, updateGrade, addSubject, deleteSubject } = useData();
  const { currentUser, role } = useAuth();
  const [viewMode, setViewMode] = useState<'trimester' | 'annual'>('trimester');
  const [filterGrado, setFilterGrado] = useState('todos');
  const [filterGrupo, setFilterGrupo] = useState('todos');

  // Buscar alumno específico si es padre
  const parentStudentId = currentUser?.studentId || localStorage.getItem('lumni_parent_student_id');
  const currentParentStudent =
    students.find((s) => s.id === parentStudentId || s.curp === parentStudentId || s.matricula === parentStudentId) ||
    null;

  // Modal para agregar/quitar materias
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Modal y estado para Importación de Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = students.filter((s) => {
    if (filterGrado !== 'todos' && s.grado !== filterGrado) return false;
    if (filterGrupo !== 'todos' && s.grupo !== filterGrupo) return false;
    return true;
  });

  const calculateStudentTrimesterAverage = (student: typeof students[0], trimester: 1 | 2 | 3) => {
    const grades = student.calificacionesTrimestres[trimester] || {};
    const scores = subjects
      .map((sub) => grades[sub.nombre])
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));

    if (scores.length === 0) return '-';
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  const calculateStudentAnnualAverage = (student: typeof students[0]) => {
    const averages: number[] = [];
    ([1, 2, 3] as const).forEach((t) => {
      const avgStr = calculateStudentTrimesterAverage(student, t);
      if (avgStr !== '-') {
        averages.push(parseFloat(avgStr));
      }
    });

    if (averages.length === 0) return '-';
    return (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1);
  };

  // Metrics for active trimester
  const tr = activeTrimester as 1 | 2 | 3;
  let totalScoresSum = 0;
  let totalScoresCount = 0;
  let passingStudents = 0;
  let atRiskStudents = 0;

  filteredStudents.forEach((student) => {
    const avg = calculateStudentTrimesterAverage(student, tr);
    if (avg !== '-') {
      const numAvg = parseFloat(avg);
      totalScoresSum += numAvg;
      totalScoresCount++;
      if (numAvg >= 6.0) passingStudents++;
      else atRiskStudents++;
    }
  });

  const groupAverage = totalScoresCount > 0 ? (totalScoresSum / totalScoresCount).toFixed(1) : '-';

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    addSubject(newSubjectName.trim(), newSubjectCode.trim());
    setNewSubjectName('');
    setNewSubjectCode('');
  };

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    downloadGradesExcelTemplate(students, subjects, tr, format);
    setIsTemplateMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    processExcelFile(file);
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

        if (rawRows.length === 0) {
          setImportErrors(['El archivo no contiene filas con datos.']);
          setImportPreview([]);
          return;
        }

        const parsedRows: any[] = [];
        const errors: string[] = [];

        rawRows.forEach((row, idx) => {
          // Detect student by Matrícula, CURP, or Name
          const rowMatricula = String(row['Matrícula'] || row['Matricula'] || row['matricula'] || '').trim();
          const rowCurp = String(row['CURP'] || row['curp'] || '').trim();
          const rowAlumno = String(row['Alumno'] || row['alumno'] || row['Nombre'] || '').trim();

          const matched = students.find((s) => {
            if (rowMatricula && s.matricula.toLowerCase() === rowMatricula.toLowerCase()) return true;
            if (rowCurp && s.curp.toLowerCase() === rowCurp.toLowerCase()) return true;
            if (rowAlumno) {
              const fullS = `${s.apellidos} ${s.nombre}`.toLowerCase();
              if (fullS.includes(rowAlumno.toLowerCase()) || rowAlumno.toLowerCase().includes(s.nombre.toLowerCase())) return true;
            }
            return false;
          });

          if (!matched) {
            errors.push(`Fila #${idx + 2}: No se encontró al alumno "${rowAlumno || rowMatricula || 'Desconocido'}" en el padrón.`);
            return;
          }

          // Extract grades for each subject
          const gradesFound: Record<string, number | null> = {};
          subjects.forEach((sub) => {
            const rawVal = row[sub.nombre] ?? row[sub.clave || ''];
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
              const num = typeof rawVal === 'number' ? Math.round(rawVal) : parseInt(String(rawVal), 10);
              if (!isNaN(num)) {
                if (num >= 5 && num <= 10) {
                  gradesFound[sub.nombre] = num;
                } else {
                  errors.push(`Fila #${idx + 2} (${matched.nombre}): Calificación "${rawVal}" en ${sub.nombre} fuera de rango (5-10).`);
                }
              }
            }
          });

          parsedRows.push({
            studentId: matched.id,
            studentName: `${matched.nombre} ${matched.apellidos}`,
            matricula: matched.matricula,
            grades: gradesFound,
          });
        });

        setImportPreview(parsedRows);
        setImportErrors(errors);
      } catch (err: any) {
        setImportErrors([`Error al leer el archivo Excel: ${err.message || 'Formato no soportado'}`]);
        setImportPreview([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyImport = () => {
    if (importPreview.length === 0) return;

    let appliedCount = 0;
    importPreview.forEach((item) => {
      Object.entries(item.grades).forEach(([subName, score]) => {
        if (typeof score === 'number') {
          updateGrade(item.studentId, tr, subName, score);
          appliedCount++;
        }
      });
    });

    setImportSuccessMsg(`¡Éxito! Se actualizaron ${appliedCount} calificaciones para ${importPreview.length} alumnos en el Trimestre ${tr}.`);
    setImportPreview([]);
    setImportFile(null);
    setTimeout(() => {
      setImportSuccessMsg(null);
      setIsImportModalOpen(false);
    }, 2500);
  };

  // Si el usuario es un padre/tutor, renderizar únicamente la Boleta Individual de su hijo
  if (role === 'parent') {
    const student = currentParentStudent;
    if (!student) {
      return (
        <div className="p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Expediente de Alumno No Encontrado</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            No pudimos localizar la información del alumno asociado a esta sesión. Por favor verifica la CURP o comunícate con el docente titular de tu plantel.
          </p>
        </div>
      );
    }

    const avgT1 = calculateStudentTrimesterAverage(student, 1);
    const avgT2 = calculateStudentTrimesterAverage(student, 2);
    const avgT3 = calculateStudentTrimesterAverage(student, 3);
    const avgAnnual = calculateStudentAnnualAverage(student);

    const handleDownloadPDF = () => {
      const teacherName = schoolInfo.director || 'Docente Titular';
      generateOfficialBoletaPDF(student, subjects, schoolInfo, teacherName);
    };

    return (
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        {/* Banner de Bienvenida y Boleta */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-slate-950 border border-amber-500/20 p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-semibold mb-2 backdrop-blur-xs">
                Boleta de Calificaciones Oficial
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {student.nombre} {student.apellidos}
              </h1>
              <p className="text-amber-100/90 text-xs sm:text-sm mt-1">
                CURP: <span className="font-mono font-bold text-white">{student.curp}</span> • Grado: <strong className="text-white">{student.grado} Grupo "{student.grupo}"</strong> • Turno: {student.turno}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="bg-white text-slate-900 hover:bg-amber-100 shadow-xl font-bold shrink-0"
              leftIcon={<Download className="w-5 h-5 text-amber-600" />}
              onClick={handleDownloadPDF}
            >
              Descargar Boleta PDF
            </Button>
          </div>
        </div>

        {/* Resumen de Promedios por Trimestre */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="1er Trimestre"
            value={avgT1}
            subtitle="Evaluación Sep - Nov"
            icon={Award}
            colorVariant="indigo"
          />
          <StatCard
            title="2do Trimestre"
            value={avgT2}
            subtitle="Evaluación Dic - Feb"
            icon={Award}
            colorVariant="amber"
          />
          <StatCard
            title="3er Trimestre"
            value={avgT3}
            subtitle="Evaluación Mar - Jun"
            icon={Award}
            colorVariant="sky"
          />
          <StatCard
            title="Promedio General"
            value={avgAnnual}
            subtitle="Ciclo Escolar 2026-2027"
            icon={TrendingUp}
            colorVariant="emerald"
            badge={{ text: 'Estatus Actual', isPositive: true }}
          />
        </div>

        {/* Desglose Completo de Materias */}
        <Card className="p-0 overflow-hidden shadow-md">
          <CardHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Desglose Detallado por Asignatura</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calificaciones asentadas por el cuerpo docente titular.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
              {subjects.length} Asignaturas
            </span>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 sm:p-4">Materia / Campo Formativo</th>
                  <th className="p-3 sm:p-4 text-center">1er Trim</th>
                  <th className="p-3 sm:p-4 text-center">2do Trim</th>
                  <th className="p-3 sm:p-4 text-center">3er Trim</th>
                  <th className="p-3 sm:p-4 text-center">Promedio</th>
                  <th className="p-3 sm:p-4 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {subjects.map((sub) => {
                  const g1 = student.calificacionesTrimestres[1]?.[sub.nombre];
                  const g2 = student.calificacionesTrimestres[2]?.[sub.nombre];
                  const g3 = student.calificacionesTrimestres[3]?.[sub.nombre];

                  const validGrades = [g1, g2, g3].filter((g): g is number => typeof g === 'number' && !isNaN(g));
                  const avgSub = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(1) : '-';
                  const numAvg = parseFloat(avgSub);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 sm:p-4 font-bold text-slate-900 dark:text-white">
                        {sub.nombre}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">{sub.clave || 'MAT-GEN'}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-center font-bold text-slate-700 dark:text-slate-200">
                        {g1 !== null && g1 !== undefined ? g1 : '-'}
                      </td>
                      <td className="p-3 sm:p-4 text-center font-bold text-slate-700 dark:text-slate-200">
                        {g2 !== null && g2 !== undefined ? g2 : '-'}
                      </td>
                      <td className="p-3 sm:p-4 text-center font-bold text-slate-700 dark:text-slate-200">
                        {g3 !== null && g3 !== undefined ? g3 : '-'}
                      </td>
                      <td className="p-3 sm:p-4 text-center font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                        {avgSub}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        {avgSub === '-' ? (
                          <span className="text-[10px] text-slate-400">En curso</span>
                        ) : numAvg >= 6 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Aprobada
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            En Riesgo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              ⚠️ Registro de control interno y evaluación formativa (documento no oficial).
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Sábana de Calificaciones & Evaluación Trimestral
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Captura interactiva de notas enteras por materia y cálculo automático de promedios ponderados y anuales.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
            <span>⚠️ Registro de control interno y evaluación formativa (documento no oficial).</span>
          </div>
        </div>

        {/* Action Toolbar: Template, Excel Import & Manage Subjects */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Template Download Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
            >
              Descargar Plantilla
            </Button>
            {isTemplateMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-in text-xs">
                <button
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Archivo CSV (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Import Excel Button */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Importar Excel
          </Button>

          {/* Manage Subjects */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BookPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            onClick={() => setIsSubjectModalOpen(true)}
          >
            Materias
          </Button>

          {/* Trimester Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setViewMode('trimester');
                setActiveTrimester(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'trimester' && activeTrimester === 1
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1° Trim
            </button>
            <button
              onClick={() => {
                setViewMode('trimester');
                setActiveTrimester(2);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'trimester' && activeTrimester === 2
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2° Trim
            </button>
            <button
              onClick={() => {
                setViewMode('trimester');
                setActiveTrimester(3);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'trimester' && activeTrimester === 3
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3° Trim
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⭐ Anual
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Promedio del Grupo"
          value={groupAverage}
          subtitle={`Evaluación del Trimestre ${activeTrimester}`}
          icon={Award}
          colorVariant="indigo"
          badge={{ text: 'Escala Institucional (5 - 10)', isPositive: true }}
        />
        <StatCard
          title="Alumnos Aprobados"
          value={`${passingStudents} / ${filteredStudents.length}`}
          subtitle={`${Math.round((passingStudents / (filteredStudents.length || 1)) * 100)}% de aprobación`}
          icon={TrendingUp}
          colorVariant="emerald"
          badge={{ text: 'Rendimiento Óptimo', isPositive: true }}
        />
        <StatCard
          title="En Riesgo Académico"
          value={atRiskStudents}
          subtitle="Promedio inferior a 6.0"
          icon={AlertTriangle}
          colorVariant={atRiskStudents > 0 ? 'rose' : 'emerald'}
          badge={{ text: atRiskStudents > 0 ? 'Requiere Atención' : 'Sin Alumnos en Riesgo', isPositive: atRiskStudents === 0 }}
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-3.5 flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Filtrar Lista:
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Grado:</span>
            <select
              value={filterGrado}
              onChange={(e) => setFilterGrado(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
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
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
            >
              <option value="todos">Todos los Grupos</option>
              <option value="A">Grupo A</option>
              <option value="B">Grupo B</option>
              <option value="C">Grupo C</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          * Las materias se capturan con <strong>números enteros (5 a 10)</strong>. Solo los promedios tienen punto decimal.
        </span>
      </Card>

      {/* Spreadsheet Card */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 m-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {viewMode === 'annual'
              ? 'Concentrado Anual de Ciclo Escolar'
              : `Captura Activa: Trimestre ${activeTrimester}`}
          </CardTitle>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Escala de evaluación escolar: <strong>5 a 10</strong> (Enteros)
          </span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Alumno</th>
                {subjects.map((sub) => (
                  <th key={sub.id} className="py-3.5 px-3 text-center min-w-[100px]">
                    {sub.nombre}
                  </th>
                ))}
                <th className="py-3.5 px-4 text-right bg-slate-50 dark:bg-slate-900/90 sticky right-0 z-10">
                  {viewMode === 'annual' ? 'Prom. Final' : `Prom. T${activeTrimester}`}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length + 2} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Aún no hay alumnos en tu aula escolar</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Registra a tus alumnos desde el módulo de Alumnos para capturar sus calificaciones.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                const studentGrades = student.calificacionesTrimestres[tr] || {};
                const currentAvg =
                  viewMode === 'annual'
                    ? calculateStudentAnnualAverage(student)
                    : calculateStudentTrimesterAverage(student, tr);

                return (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-950 z-10 border-r border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">{student.nombre} {student.apellidos}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{student.matricula} • {student.grado} {student.grupo}</p>
                    </td>

                    {subjects.map((sub) => {
                      const grade = studentGrades[sub.nombre];

                      if (viewMode === 'annual') {
                        const g1 = student.calificacionesTrimestres[1]?.[sub.nombre];
                        const g2 = student.calificacionesTrimestres[2]?.[sub.nombre];
                        const g3 = student.calificacionesTrimestres[3]?.[sub.nombre];
                        const validGrades = [g1, g2, g3].filter((g): g is number => typeof g === 'number');
                        const subjectAnnualAvg =
                          validGrades.length > 0
                            ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(1)
                            : '-';

                        return (
                          <td key={sub.id} className="py-3 px-3 text-center text-xs font-semibold">
                            <span
                              className={`px-2 py-1 rounded-md font-bold ${
                                subjectAnnualAvg !== '-' && parseFloat(subjectAnnualAvg) >= 9.0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : subjectAnnualAvg !== '-' && parseFloat(subjectAnnualAvg) < 6.0
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {subjectAnnualAvg}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={sub.id} className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="1"
                            min="5"
                            max="10"
                            placeholder="-"
                            value={grade !== undefined && grade !== null ? grade : ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              if (val !== null && (val < 5 || val > 10)) return;
                              updateGrade(student.id, tr, sub.nombre, val);
                            }}
                            className={`w-14 text-center py-1.5 rounded-lg border text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              grade !== undefined && grade !== null && grade >= 9
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300'
                                : grade !== undefined && grade !== null && grade < 6
                                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:border-rose-500/40 dark:text-rose-300'
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                            }`}
                          />
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right sticky right-0 bg-white dark:bg-slate-950 z-10 border-l border-slate-100 dark:border-slate-800">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          currentAvg !== '-' && parseFloat(currentAvg) >= 9.0
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : currentAvg !== '-' && parseFloat(currentAvg) < 6.0
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {currentAvg}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Gestión de Materias Dinámicas */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Gestión de Materias del Plantel"
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Formulario Agregar Nueva Materia */}
          <form onSubmit={handleCreateSubject} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">Agregar Nueva Materia</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre de la Materia"
                required
                placeholder="Ej. Robótica, Computación"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
              <Input
                label="Clave (Opcional)"
                placeholder="Ej. ROB-101"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" leftIcon={<BookPlus className="w-4 h-4" />}>
                Agregar Materia
              </Button>
            </div>
          </form>

          {/* Lista de Materias Actuales */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
              Materias Registradas ({subjects.length})
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 transition">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{sub.nombre}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{sub.clave || 'Sin clave'}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`¿Seguro que deseas eliminar la materia "${sub.nombre}"?`)) {
                        deleteSubject(sub.id);
                      }
                    }}
                    title="Eliminar materia"
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)}>
              Listo / Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Importación Masiva de Calificaciones desde Excel/CSV */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportPreview([]);
          setImportErrors([]);
          setImportSuccessMsg(null);
        }}
        title={`Importar Calificaciones — Trimestre ${activeTrimester}`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {importSuccessMsg ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{importSuccessMsg}</p>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Instrucciones de Importación:
                </p>
                <p>
                  Sube tu archivo <strong>.xlsx</strong> o <strong>.csv</strong> generado a partir de la plantilla. El sistema asociará los alumnos por <strong>Matrícula</strong> o <strong>CURP</strong> y aplicará las calificaciones (enteros del <strong>5 al 10</strong>) en el <strong>Trimestre {activeTrimester}</strong>.
                </p>
              </div>

              {/* Upload Dropzone / File Picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/20"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {importFile ? importFile.name : 'Haz clic para seleccionar o arrastra tu archivo aquí'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Formatos compatibles: Microsoft Excel (.xlsx, .xls) o CSV (.csv)
                </p>
              </div>

              {/* Warnings / Errors */}
              {importErrors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    Advertencias durante la lectura ({importErrors.length}):
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                      Vista previa de calificaciones detectadas ({importPreview.length} alumnos):
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" /> Listo para procesar
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Matrícula</th>
                          <th className="py-2 px-3">Alumno</th>
                          <th className="py-2 px-3 text-center">Materias con Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {importPreview.slice(0, 10).map((row, idx) => {
                          const countGrades = Object.keys(row.grades).length;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                              <td className="py-1.5 px-3 font-mono text-[11px]">{row.matricula}</td>
                              <td className="py-1.5 px-3 font-medium text-slate-900 dark:text-white">{row.studentName}</td>
                              <td className="py-1.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                  {countGrades} {countGrades === 1 ? 'materia' : 'materias'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 10 && (
                    <p className="text-[11px] text-slate-400 text-center">
                      ... y {importPreview.length - 10} alumnos más en el archivo.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setImportErrors([]);
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={importPreview.length === 0}
                  onClick={handleApplyImport}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Aplicar a Trimestre {activeTrimester}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
