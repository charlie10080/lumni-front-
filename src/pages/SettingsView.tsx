import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { InstallAppModal } from '../components/layout/InstallAppModal';
import {
  Settings,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  FileJson,
  Check,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';

const AVATAR_OPTIONS = [
  '👨‍🏫',
  '👩‍🏫',
  '🧑‍🏫',
  '👨‍🔬',
  '👩‍🔬',
  '👨‍💼',
  '👩‍💼',
  '🦉',
];

export const SettingsView: React.FC = () => {
  const {
    schoolInfo,
    updateSchoolInfo,
    exportFullBackupJSON,
    importBackupJSON,
    resetToDefaultData,
  } = useData();
  const { currentUser, updateProfile, role } = useAuth();

  // School info form state
  const [schoolFormData, setSchoolFormData] = useState({ ...schoolInfo });
  const [schoolSaveSuccess, setSchoolSaveSuccess] = useState(false);

  // Profile form state
  const [profileFormData, setProfileFormData] = useState({
    nombre: currentUser?.nombre || '',
    apellidos: currentUser?.apellidos || '',
    email: currentUser?.email || '',
    colegio: currentUser?.colegio || '',
    grupo: currentUser?.grupo || '',
    ciclo: currentUser?.ciclo || '',
    avatarUrl: currentUser?.avatarUrl || '👨‍🏫',
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Backup & Restore states
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Concluir ciclo escolar modal
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleCompleted, setCycleCompleted] = useState(false);

  // Reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);


  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolInfo(schoolFormData);
    setSchoolSaveSuccess(true);
    setTimeout(() => setSchoolSaveSuccess(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileFormData);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackupJSON(text);
        if (success) {
          setBackupMessage({ type: 'success', text: '¡Copia de seguridad restaurada con éxito!' });
        } else {
          setBackupMessage({ type: 'error', text: 'El archivo no tiene el formato JSON válido de Lumni.' });
        }
      } catch {
        setBackupMessage({ type: 'error', text: 'Error al procesar el archivo JSON.' });
      }
      setTimeout(() => setBackupMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleConcludeCycle = () => {
    exportFullBackupJSON();
    setCycleCompleted(true);
    setTimeout(() => {
      setCycleCompleted(false);
      setIsCycleModalOpen(false);
    }, 3000);
  };

  const handleConfirmReset = () => {
    resetToDefaultData();
    setIsResetModalOpen(false);
    setBackupMessage({ type: 'success', text: 'Todos los datos se restablecieron a su estado inicial de demostración.' });
    setTimeout(() => setBackupMessage(null), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Ajustes del Sistema, Perfil & Respaldo
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Configuración institucional del plantel, datos del docente, administración de suscripción y copias de seguridad completas.
        </p>
      </div>

      {backupMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
            backupMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {backupMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{backupMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile & School Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Docente Profile Card */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {role === 'teacher' ? 'Perfil del Docente Titular' : 'Perfil del Tutor'}
              </CardTitle>
              {profileSaveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Perfil Actualizado
                </span>
              )}
            </CardHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona tu Avatar / Icono de Usuario
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setProfileFormData({ ...profileFormData, avatarUrl: emoji })}
                      className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition cursor-pointer ${
                        profileFormData.avatarUrl === emoji
                          ? 'bg-indigo-600 text-white shadow-md scale-110 ring-2 ring-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre(s)"
                  value={profileFormData.nombre}
                  onChange={(e) => setProfileFormData({ ...profileFormData, nombre: e.target.value })}
                />
                <Input
                  label="Apellidos"
                  value={profileFormData.apellidos}
                  onChange={(e) => setProfileFormData({ ...profileFormData, apellidos: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={profileFormData.email}
                  onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                />
                <Input
                  label="Colegio / Plantel"
                  value={profileFormData.colegio}
                  onChange={(e) => setProfileFormData({ ...profileFormData, colegio: e.target.value })}
                />
              </div>

              {role === 'teacher' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Grupo Asignado"
                    placeholder="Ej. 3er Grado - Grupo B"
                    value={profileFormData.grupo}
                    onChange={(e) => setProfileFormData({ ...profileFormData, grupo: e.target.value })}
                  />
                  <Input
                    label="Ciclo Escolar"
                    placeholder="Ej. 2026-2027"
                    value={profileFormData.ciclo}
                    onChange={(e) => setProfileFormData({ ...profileFormData, ciclo: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
                  Guardar Perfil
                </Button>
              </div>
            </form>
          </Card>

          {/* 2. School Info Form */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Ficha Técnica del Plantel Escolar
              </CardTitle>
              {schoolSaveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Guardado
                </span>
              )}
            </CardHeader>

            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre del Colegio / Escuela"
                  value={schoolFormData.nombre}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, nombre: e.target.value })}
                />
                <Input
                  label="Clave C.C.T."
                  value={schoolFormData.cct}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, cct: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ciclo Escolar Vigente"
                  value={schoolFormData.ciclo}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, ciclo: e.target.value })}
                />
                <Input
                  label="Nombre del Director(a)"
                  value={schoolFormData.director}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, director: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Dirección Oficial"
                  value={schoolFormData.direccion}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, direccion: e.target.value })}
                />
                <Input
                  label="Teléfono de Contacto"
                  value={schoolFormData.telefono}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, telefono: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
                  Guardar Ficha Técnica
                </Button>
              </div>
            </form>
          </Card>

          {/* 3. JSON Backup, Restore & Reset Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Copias de Seguridad & Migración de Datos (JSON)
              </CardTitle>
            </CardHeader>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Exporta toda la base de datos local (alumnos, calificaciones, asistencias, avisos, expedientes de conducta e información escolar) en un archivo JSON portátil o restáurala en cualquier dispositivo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Export JSON */}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={exportFullBackupJSON}
                >
                  Exportar Backup (.json)
                </Button>

                {/* Import JSON */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    leftIcon={<Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Restaurar Backup
                  </Button>
                </div>

                {/* Reset to Factory Defaults */}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-4 h-4 text-rose-500" />}
                  onClick={() => setIsResetModalOpen(true)}
                >
                  Restablecer Demo
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Backend, Subscription & Conclude Cycle */}
        <div className="space-y-6">
          {/* Teacher Subscription Card */}
          {currentUser?.suscripcion && (
            <Card className="border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                    Suscripción Docente Pro
                  </CardTitle>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Activa
                  </span>
                </div>
              </CardHeader>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Tarifa Mensual:</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">$50 MXN / mes</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    (Inscripción inicial única: $250 MXN)
                  </p>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Próxima Facturación:</span>
                    <strong className="text-slate-900 dark:text-white">{currentUser.suscripcion.proximoPago}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Capacidad Máxima:</span>
                    <strong className="text-slate-900 dark:text-white">{currentUser.maxAlumnos || 50} alumnos</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Meses de Antigüedad:</span>
                    <span className="text-slate-900 dark:text-white">{currentUser.suscripcion.mesesActivo} meses</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Beneficios incluidos:</p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Sábana de notas y exportación Excel
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Boletas y credenciales con QR imprimibles
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Portal de comunicación con tutores
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* PWA Mobile App Card */}
          <Card className="border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-indigo-700 dark:text-indigo-400">
                <Smartphone className="w-5 h-5" />
                Aplicación Móvil LUMNI (PWA)
              </CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                LUMNI funciona como aplicación nativa en tu teléfono Android, iPhone o iPad sin ocupar memoria de descarga.
              </p>
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Ventajas en celular:
                </p>
                <p>• Pase de lista y escáner QR a pantalla completa</p>
                <p>• Notificaciones directas de mensajes</p>
                <p>• Sin necesidad de descargar archivos pesados</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                leftIcon={<Smartphone className="w-4 h-4" />}
                onClick={() => setIsInstallModalOpen(true)}
              >
                Descargar / Instalar en mi Teléfono
              </Button>
            </div>
          </Card>

          {/* Conclude School Cycle Card */}
          {role === 'teacher' && (
            <Card className="border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                  <Calendar className="w-5 h-5" />
                  Cierre de Ciclo Escolar
                </CardTitle>
              </CardHeader>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  Al terminar el año lectivo puedes archivar las calificaciones del grupo y avanzar al siguiente ciclo con la tarifa preferencial de renovación.
                </p>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Renovación Anual con Descuento:
                  </p>
                  <p>
                    Renueva tu siguiente ciclo por solo <strong>$200 MXN</strong> (Ahorras $50 MXN respecto a la inscripción inicial).
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  leftIcon={<Layers className="w-4 h-4" />}
                  onClick={() => setIsCycleModalOpen(true)}
                >
                  Concluir Ciclo Escolar
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />


      {/* Modal: Concluir Ciclo Escolar */}
      <Modal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        title="Conclusión de Ciclo Escolar & Promoción"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {cycleCompleted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                ¡Ciclo Escolar Concluido con Éxito!
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Se ha descargado el respaldo completo de este ciclo en tu equipo. Tu cuenta está lista para el nuevo ciclo escolar con el descuento de renovación de $200 MXN.
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Estás por finalizar el ciclo escolar <strong>{schoolInfo.ciclo}</strong>. Antes del cierre, el sistema generará y descargará automáticamente un respaldo completo en formato JSON con todas las notas, asistencias e incidencias del grupo.
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Beneficio de Lealtad LUMNI:
                </p>
                <p>
                  Por concluir el ciclo con nosotros, tu reinscripción para el siguiente año lectivo tiene un costo preferencial de <strong>$200 MXN</strong> en lugar de $250 MXN.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button variant="secondary" size="sm" onClick={() => setIsCycleModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleConcludeCycle}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Generar Respaldo & Concluir
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal: Confirm Reset */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Restablecer Datos de Demostración"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              ¿Estás seguro de restablecer?
            </p>
            <p>
              Esta acción borrará todas las modificaciones locales y recargará los datos de ejemplo iniciales (alumnos, notas y materias).
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsResetModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmReset}
            >
              Sí, Restablecer Todo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
