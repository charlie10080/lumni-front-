import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Student, SchoolInfo } from '../../types';
import {
  downloadStudentExcelTemplate,
  parseStudentExcelFile,
  ParsedStudentRow,
} from '../../utils/studentImportUtils';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  FileCheck,
  Check,
  Info,
} from 'lucide-react';

export interface BulkStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  schoolInfo: SchoolInfo;
  onImportStudents: (
    newStudents: Array<Omit<Student, 'id' | 'asistenciasPorFecha' | 'asistenciasTotales' | 'calificacionesTrimestres'>>
  ) => void;
}

export const BulkStudentImportModal: React.FC<BulkStudentImportModalProps> = ({
  isOpen,
  onClose,
  existingStudents,
  schoolInfo,
  onImportStudents,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedResults, setParsedResults] = useState<{
    students: ParsedStudentRow[];
    validCount: number;
    invalidCount: number;
    errors: string[];
  } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    downloadStudentExcelTemplate(schoolInfo);
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setErrorBanner(null);

    try {
      const results = await parseStudentExcelFile(
        file,
        existingStudents,
        '3°',
        'B',
        'Matutino',
        schoolInfo.ciclo || '2026'
      );
      setParsedResults(results);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al procesar el archivo Excel.');
      setParsedResults(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResults || parsedResults.validCount === 0) return;
    setIsSaving(true);

    const validRows = parsedResults.students.filter((s) => s.isValid);
    const toImport = validRows.map((row) => ({
      nombre: row.nombre,
      apellidos: row.apellidos,
      curp: row.curp,
      matricula: row.matricula,
      fechaNacimiento: row.fechaNacimiento,
      genero: row.genero,
      grado: row.grado,
      grupo: row.grupo,
      turno: row.turno,
      tutorNombre: row.tutorNombre,
      tutorTelefono: row.tutorTelefono,
      tutorParentesco: row.tutorParentesco,
      activo: true,
      fotoUrl: row.fotoUrl,
    }));

    onImportStudents(toImport);
    setIsSaving(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedResults(null);
    setErrorBanner(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Carga Masiva de Alumnos vía Plantilla Excel (.xlsx)"
      maxWidth="3xl"
    >
      <div className="space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        {/* Step 1: Template Download Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Descarga la Plantilla Oficial de Registro
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Vacíala con tus alumnos. Puedes dejar la <strong>CURP</strong> y <strong>Matrícula</strong> en blanco y LUMNI las generará automáticamente.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadTemplate}
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
          >
            Descargar Plantilla (.xlsx)
          </Button>
        </div>

        {/* Step 2: Upload Dropzone */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              2
            </span>
            <span>Sube tu archivo completado</span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50 space-y-2 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <FileCheck className="w-4 h-4" /> {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Haz clic para cambiar de archivo
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  Arrastra aquí tu archivo Excel o haz clic para seleccionarlo
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Formatos compatibles: Microsoft Excel (.xlsx, .xls) o CSV (.csv)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Step 3: Parsing Preview */}
        {isParsing && (
          <div className="p-8 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Procesando lista y calculando CURPs y matrículas oficiales...
            </p>
          </div>
        )}

        {parsedResults && !isParsing && (
          <div className="space-y-3 pt-2">
            {/* Summary Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                  {parsedResults.validCount} {parsedResults.validCount === 1 ? 'alumno detectado' : 'alumnos listos para registro'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  ✓ {parsedResults.validCount} Válidos
                </span>
                {parsedResults.invalidCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
                    ✕ {parsedResults.invalidCount} Con errores
                  </span>
                )}
              </div>
            </div>

            {/* Smart calculation notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Generador Inteligente Lumni:</strong> Se calcularon automáticamente los <strong>11 caracteres base de CURP</strong> y las matrículas correlativas para los alumnos sin datos previos.
              </span>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">No.</th>
                    <th className="py-2.5 px-3">Alumno</th>
                    <th className="py-2.5 px-3">CURP Calculada</th>
                    <th className="py-2.5 px-3">Matrícula</th>
                    <th className="py-2.5 px-3">Grado/Grupo</th>
                    <th className="py-2.5 px-3">Tutor / Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedResults.students.map((st, i) => (
                    <tr
                      key={i}
                      className={st.isValid ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40' : 'bg-rose-500/10'}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{st.index}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {st.nombre} {st.apellidos}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {st.curpCalculada11}
                        </span>
                        <span className="text-slate-400">{st.curp.substring(11)}</span>
                        {st.isCurpAutogenerated && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase">
                            Auto
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {st.matricula}
                      </td>
                      <td className="py-2 px-3">
                        {st.grado} &quot;{st.grupo}&quot;
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        <p className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {st.tutorNombre}
                        </p>
                        <p className="text-[10px] text-slate-400">{st.tutorTelefono}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>

          {parsedResults && parsedResults.validCount > 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              leftIcon={
                isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />
              }
            >
              {isSaving ? 'Registrando alumnos...' : `Registrar ${parsedResults.validCount} Alumnos en LUMNI`}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled
              leftIcon={<Check className="w-4 h-4" />}
            >
              Selecciona un archivo
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
