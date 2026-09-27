import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  AlertTriangle,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { deleteAccountAndData, currentUser } = useAuth();
  const { exportFullBackupJSON } = useData();

  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasExportedBackup, setHasExportedBackup] = useState(false);

  const REQUIRED_CONFIRM_PHRASE = 'ELIMINAR';
  const isPhraseMatched = confirmText.trim().toUpperCase() === REQUIRED_CONFIRM_PHRASE;

  const handleExportBackup = () => {
    exportFullBackupJSON();
    setHasExportedBackup(true);
  };

  const handleConfirmDelete = async () => {
    if (!isPhraseMatched || isDeleting) return;

    setErrorMessage('');
    setIsDeleting(true);

    try {
      const result = await deleteAccountAndData();
      if (!result.success) {
        setErrorMessage(result.error || 'Ocurrió un error al procesar el borrado de tu cuenta.');
        setIsDeleting(false);
      } else {
        // La sesión se cerrará automáticamente en AuthContext y redirigirá al login
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al eliminar los datos.');
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) {
          setConfirmText('');
          setErrorMessage('');
          onClose();
        }
      }}
      title="Eliminación Definitiva de Cuenta & Derecho al Olvido"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-sm sm:text-base">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            <span>Esta acción es definitiva, irreversible e inmediata</span>
          </div>
          <p className="text-xs leading-relaxed">
            Conforme al <strong>Derecho al Olvido</strong>, se procederá a la destrucción permanente de toda la información ligada a tu cuenta de docente (<code className="font-mono font-semibold">{currentUser?.email}</code>).
          </p>
        </div>

        {/* Consequence Checklist */}
        <div className="space-y-2 text-xs">
          <p className="font-bold text-slate-900 dark:text-white">
            Datos que serán eliminados sin posibilidad de recuperación:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
            <li>
              <strong>Perfil de usuario:</strong> Datos personales, correo, credenciales y suscripción docente activa.
            </li>
            <li>
              <strong>Expedientes de alumnos:</strong> Todos los estudiantes registrados con sus datos de CURP, matrícula y tutor.
            </li>
            <li>
              <strong>Historial de calificaciones y asistencias:</strong> Evaluaciones trimestrales, pases de lista matutinos y reportes de incidencias.
            </li>
            <li>
              <strong>Comunicación y avisos:</strong> Comunicados publicados, tareas escolares y conversaciones de mensajería con padres de familia.
            </li>
            <li>
              <strong>Accesos de tutores:</strong> Se revocarán de inmediato las credenciales de consulta por CURP de los familiares.
            </li>
          </ul>
        </div>

        {/* Recommended Step: Backup Download */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Recomendación de Seguridad (Portabilidad de Datos):
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Descarga una copia completa de tus alumnos y calificaciones en archivo JSON antes de continuar.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportBackup}
            leftIcon={
              hasExportedBackup ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Download className="w-4 h-4 text-indigo-600" />
              )
            }
            className="whitespace-nowrap shrink-0"
          >
            {hasExportedBackup ? 'Copia Descargada' : 'Descargar Copia JSON'}
          </Button>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">
            Para confirmar la eliminación permanente, escribe la palabra{' '}
            <span className="font-mono text-rose-600 dark:text-rose-400 font-extrabold">&quot;ELIMINAR&quot;</span>:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Escribe ELIMINAR para continuar"
            disabled={isDeleting}
            className="font-mono uppercase tracking-wider"
          />
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConfirmText('');
              setErrorMessage('');
              onClose();
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={!isPhraseMatched || isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
            leftIcon={
              isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )
            }
          >
            {isDeleting ? 'Borrando cuenta y datos...' : 'Confirmar Eliminación Definitiva'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
