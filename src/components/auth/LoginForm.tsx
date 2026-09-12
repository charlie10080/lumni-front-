import React, { useState } from 'react';
import { useAuth, RegisterTeacherData } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { InstallAppModal } from '../layout/InstallAppModal';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  Users,
  ArrowRight,
  School,
  Search,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Smartphone,
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, registerTeacher, loginAsParentWithStudent, loginAs, isLoading } = useAuth();
  
  // Tab principal: 'teacher' o 'parent'
  const [activeTab, setActiveTab] = useState<'teacher' | 'parent'>('teacher');
  
  // Sub-modo para docentes: 'login' o 'register'
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');

  // Estados Formulario Docente (Login)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados Formulario Docente (Registro)
  const [regNombre, setRegNombre] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regColegio, setRegColegio] = useState('');
  const [regGrupo, setRegGrupo] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Estados Formulario Tutor (CURP o Matrícula)
  const [parentCurp, setParentCurp] = useState('');

  // Estados de Error y Modales
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);


  // Login de Docente
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Credenciales no válidas.');
    }
  };

  // Registro de Docente desde cero
  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regNombre.trim() || !regEmail.trim() || !regPassword) {
      setError('Por favor completa todos los campos requeridos (*).');
      return;
    }

    if (regPassword.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }

    try {
      const regData: RegisterTeacherData = {
        nombre: regNombre.trim(),
        apellidos: regApellidos.trim(),
        colegio: regColegio.trim() || 'Colegio Lumni de Excelencia',
        grupo: regGrupo.trim() || '3° B',
        email: regEmail.trim(),
        password: regPassword,
        ciclo: '2026-2027',
      };

      await registerTeacher(regData);
      setSuccessMsg('¡Cuenta de docente creada con éxito! Redirigiendo a tu aula...');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Intenta con otro correo.');
    }
  };

  // Acceso para Tutor por CURP o Código
  const handleParentLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!parentCurp.trim()) {
      setError('Por favor ingresa la CURP o Matrícula del alumno.');
      return;
    }

    const res = await loginAsParentWithStudent(parentCurp);
    if (!res.success) {
      setError(res.error || 'No se encontró el alumno.');
    }
  };

  // Acceso de prueba con CURP predefinida
  const handleSelectDemoStudent = (curp: string) => {
    setParentCurp(curp);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 animate-fade-in my-6">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-2 ring-indigo-400/20 mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-brand">
            LUMNI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-center gap-1.5">
            <School className="w-3.5 h-3.5 text-indigo-500" /> Plataforma Escolar • Docentes y Familias
          </p>
        </div>

        {/* Primary Role Tabs: Docente vs Tutor */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('teacher');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Docentes</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('parent');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'parent'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Padres y Tutores</span>
          </button>
        </div>

        {/* Global Error & Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium animate-shake">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DOCENTES (Login o Registro desde cero) */}
        {/* ======================================================== */}
        {activeTab === 'teacher' && (
          <div className="space-y-4">
            {/* Sub-selector: Iniciar Sesión / Registrarme */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherMode('login');
                    setError('');
                  }}
                  className={`text-xs sm:text-sm font-bold pb-1 cursor-pointer transition ${
                    teacherMode === 'login'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherMode('register');
                    setError('');
                  }}
                  className={`text-xs sm:text-sm font-bold pb-1 cursor-pointer transition flex items-center gap-1.5 ${
                    teacherMode === 'register'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Crear Cuenta de Maestro</span>
                </button>
              </div>
            </div>

            {/* A) Formulario Iniciar Sesión Docente */}
            {teacherMode === 'login' && (
              <form onSubmit={handleTeacherLogin} className="space-y-4 pt-1">
                <Input
                  label="Correo Electrónico Institucional"
                  type="email"
                  placeholder="tu.nombre@colegio.edu.mx"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Ingresar a mi Aula
                </Button>
              </form>
            )}

            {/* B) Formulario Registro de Docente desde Cero */}
            {teacherMode === 'register' && (
              <form onSubmit={handleTeacherRegister} className="space-y-3.5 pt-1">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p>
                    Registra tu aula escolar. Tendrás acceso inmediato al escáner QR, calificaciones y boletas en PDF.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nombre(s) *"
                    type="text"
                    placeholder="Ej. Carlos"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    required
                  />
                  <Input
                    label="Apellidos"
                    type="text"
                    placeholder="Ej. Mendoza Martínez"
                    value={regApellidos}
                    onChange={(e) => setRegApellidos(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Escuela o Plantel"
                    type="text"
                    placeholder="Ej. Secundaria Técnica #45"
                    value={regColegio}
                    onChange={(e) => setRegColegio(e.target.value)}
                  />
                  <Input
                    label="Grado y Grupo"
                    type="text"
                    placeholder="Ej. 3° B"
                    value={regGrupo}
                    onChange={(e) => setRegGrupo(e.target.value)}
                  />
                </div>

                <Input
                  label="Correo Electrónico Institucional *"
                  type="email"
                  placeholder="carlos.mendoza@colegio.edu.mx"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Contraseña (mín. 6 car.) *"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer focus:outline-none"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirmar Contraseña *"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-3"
                  isLoading={isLoading}
                  rightIcon={<UserPlus className="w-4 h-4" />}
                >
                  Crear Mi Cuenta de Maestro
                </Button>
              </form>
            )}

            {/* Fast Demo Teacher Button */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => loginAs('teacher')}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                ⚡ Probar Demo Rápido de Maestro (Prof. Carlos Mendoza)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PADRES Y TUTORES (Acceso por CURP o Código) */}
        {/* ======================================================== */}
        {activeTab === 'parent' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-800 dark:text-amber-300">
                <GraduationCap className="w-4 h-4" />
                <span>Consulta Escolar para Padres de Familia</span>
              </div>
              <p className="leading-relaxed">
                Ingresa la <strong>CURP</strong> o el <strong>Código de Matrícula</strong> de tu hijo(a) para consultar calificaciones, asistencia del día y avisos de forma instantánea.
              </p>
            </div>

            <form onSubmit={handleParentLookup} className="space-y-4">
              <Input
                label="CURP o Matrícula del Alumno *"
                type="text"
                placeholder="Ej. RAMJ120405HDFRRL01 o ALU-2026-001"
                leftIcon={<Search className="w-4 h-4 text-amber-500" />}
                value={parentCurp}
                onChange={(e) => setParentCurp(e.target.value.toUpperCase())}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md shadow-amber-600/20"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Consultar Expediente del Alumno
              </Button>
            </form>

            {/* Quick Demo Student Access for Parents */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Alumnos de demostración (Haz clic para probar):
              </p>
              <div className="space-y-1.5">
                {[
                  { name: 'Mateo Ramírez Soto', curp: 'RAMJ120405HDFRRL01', grade: '3° B' },
                  { name: 'Valeria González Díaz', curp: 'GODV120914MMNRL02', grade: '3° B' },
                  { name: 'Santiago Cruz Reyes', curp: 'CURS120120HDFRYS03', grade: '3° B' },
                ].map((stu) => (
                  <button
                    key={stu.curp}
                    type="button"
                    onClick={() => handleSelectDemoStudent(stu.curp)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{stu.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">({stu.grade})</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      {stu.curp}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer: Install Mobile App Helper Link */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>📲 ¿Cómo instalar LUMNI en mi celular?</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />

      {/* Install App Modal */}
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
    </div>
  );
};


