import React, { useState } from 'react';
import { useAuth, RegisterTeacherData } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { InstallAppModal } from '../layout/InstallAppModal';
import { ThreeGlobeBackground } from './ThreeGlobeBackground';
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
  Sun,
  Moon,
  Loader2,
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, registerTeacher, loginAsParentWithStudent, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  // Registro de Docente
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

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${isLight ? 'light-theme bg-[#e2e8f5]' : 'bg-[#070913]'} selection:bg-indigo-500 selection:text-white`}>
      {/* Three.js Canvas Background */}
      <ThreeGlobeBackground theme={theme} />

      {/* Main Container */}
      <div className="theme-wrapper pointer-events-none relative z-10 min-h-screen min-h-[100dvh] w-full flex flex-col justify-center items-center px-4 py-6 sm:py-10">
        
        {/* Top toolbar with Theme Switcher */}
        <header className="w-full max-w-[440px] flex justify-end items-center mb-3 px-1 pointer-events-auto">
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema de color"
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full glass-card border border-white/10 dark:border-white/10 hover:scale-105 active:scale-95 transition-all text-indigo-500 dark:text-indigo-300 shadow-md backdrop-blur-md cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 block" />
            ) : (
              <Moon className="w-5 h-5 block text-indigo-600" />
            )}
          </button>
        </header>

        {/* Auth Card */}
        <main className="w-full max-w-[440px] glass-card rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-2xl relative pointer-events-auto border border-white/15 dark:border-white/10">
          {/* Glow Accent behind Header */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6 z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-300 p-[1.5px] shadow-glow mb-4 flex items-center justify-center">
              <div className="w-full h-full rounded-[15px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-white relative z-10 drop-shadow" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-slate-900 dark:text-white mb-2 font-heading">
              LUMNI
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
              <School className="w-4 h-4 text-indigo-500 inline shrink-0" />
              <span>Plataforma Escolar • Docentes y Familias</span>
            </p>
          </div>

          {/* Role Segmented Switcher */}
          <div className="role-switcher-bg w-full bg-slate-200/70 dark:bg-black/40 border border-slate-300/80 dark:border-white/10 p-1 rounded-2xl flex items-center mb-6 shadow-inner transition-colors">
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Docentes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('parent');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
                activeTab === 'parent'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Padres y Tutores</span>
            </button>
          </div>

          {/* Sub-Tabs for Docentes (Iniciar Sesión / Crear Cuenta) */}
          {activeTab === 'teacher' && (
            <div className="border-tab-divider w-full flex items-center justify-start border-b border-slate-200 dark:border-white/10 mb-6 gap-6 px-1 transition-colors">
              <button
                type="button"
                onClick={() => {
                  setTeacherMode('login');
                  setError('');
                }}
                className={`pb-2.5 text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  teacherMode === 'login'
                    ? 'text-slate-900 dark:text-white border-b-2 border-indigo-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                className={`pb-2.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  teacherMode === 'register'
                    ? 'text-slate-900 dark:text-white border-b-2 border-indigo-500 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear Cuenta de Maestro</span>
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium animate-shake">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="w-full mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          {/* FORMULARIO: DOCENTES - INICIAR SESIÓN */}
          {activeTab === 'teacher' && teacherMode === 'login' && (
            <form onSubmit={handleTeacherLogin} className="w-full space-y-4" data-purpose="login-form">
              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase" htmlFor="emailInput">
                  CORREO ELECTRÓNICO INSTITUCIONAL
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="emailInput"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.nombre@colegio.edu.mx"
                    className="input-glass w-full rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase" htmlFor="passwordInput">
                  CONTRASEÑA
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="passwordInput"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input-glass w-full rounded-xl pl-10 pr-11 py-3 text-xs sm:text-sm outline-none tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Mostrar o ocultar contraseña"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 shadow-glow hover:shadow-glow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Ingresar a mi Aula</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* FORMULARIO: DOCENTES - REGISTRO DESDE CERO */}
          {activeTab === 'teacher' && teacherMode === 'register' && (
            <form onSubmit={handleTeacherRegister} className="w-full space-y-3.5" data-purpose="register-form">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Crea tu aula escolar para gestionar asistencias QR, calificaciones y boletas oficiales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Nombre(s) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mendoza"
                    value={regApellidos}
                    onChange={(e) => setRegApellidos(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Escuela o Plantel
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Secundaria #45"
                    value={regColegio}
                    onChange={(e) => setRegColegio(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Grado y Grupo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 3° B"
                    value={regGrupo}
                    onChange={(e) => setRegGrupo(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Correo Electrónico Institucional *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="carlos.mendoza@colegio.edu.mx"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input-glass w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Contraseña *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="input-glass w-full rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2 text-slate-400 hover:text-indigo-500 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Confirmar *
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-glow active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear Mi Cuenta de Maestro</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* FORMULARIO: PADRES Y TUTORES (CONSULTA POR CURP / MATRÍCULA) */}
          {activeTab === 'parent' && (
            <form onSubmit={handleParentLookup} className="w-full space-y-4" data-purpose="parent-form">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold mb-1 text-amber-800 dark:text-amber-300">
                  <GraduationCap className="w-4 h-4" />
                  <span>Portal de Consulta para Familias</span>
                </div>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  Ingresa la <strong>CURP</strong> o la <strong>Matrícula</strong> del alumno proporcionada por el docente para ver asistencias, avisos y calificaciones.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase" htmlFor="parentCurpInput">
                  CURP O MATRÍCULA DEL ALUMNO
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4 text-amber-500" />
                  </div>
                  <input
                    id="parentCurpInput"
                    name="parentCurp"
                    type="text"
                    required
                    value={parentCurp}
                    onChange={(e) => setParentCurp(e.target.value.toUpperCase())}
                    placeholder="Ej. RAMJ120405HDFRRL01 o MAT-001"
                    className="input-glass w-full rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 shadow-md shadow-amber-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Consultar Expediente del Alumno</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider Line */}
          <div className="w-full pt-4">
            <hr className="border-slate-200 dark:border-white/10" />
          </div>

          {/* Bottom Action: Install App Pill */}
          <div className="pt-3 flex justify-center w-full">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="install-pill w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300/80 dark:border-white/10 hover:border-indigo-400/40 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium transition-all duration-200 backdrop-blur-sm cursor-pointer"
              type="button"
            >
              <span className="text-base leading-none">📲</span>
              <span>¿Deseas instalar la app en tu celular?</span>
            </button>
          </div>
        </main>
      </div>

      {/* Modales */}
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
    </div>
  );
};
