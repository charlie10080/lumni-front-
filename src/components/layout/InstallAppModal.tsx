import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2, Laptop, Apple, Chrome } from 'lucide-react';
import { Button } from '../ui/Button';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect OS default tab
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab('ios');
    } else if (/android/.test(ua)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    // Check if already running standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar en este navegador, usa la opción "Instalar aplicación" o "Agregar a la pantalla principal" en el menú de tu navegador.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-5 animate-scale-up">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              ¿Deseas instalar la app?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instala LUMNI en tu pantalla de inicio para entrar directo en 1 toque.
            </p>
          </div>
        </div>


        {/* Device Tabs */}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Chrome className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Computadora</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs">
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Opción 1: Botón Directo</p>
                  <p className="text-slate-500 dark:text-slate-400">Si tu navegador Chrome lo soporta, pulsa el botón inferior para instalar automáticamente.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Opción 2: Desde el menú de Chrome</p>
                  <p className="text-slate-500 dark:text-slate-400">Toca los <strong>3 puntos verticales (⋮)</strong> en la esquina superior derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</p>
                </div>
              </div>

              {deferredPrompt && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full py-2.5 shadow-lg shadow-indigo-600/20"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleTriggerInstall}
                  >
                    Instalar en este Dispositivo Android
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Abre en Safari y toca Compartir <Share className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">En la barra inferior de tu iPhone, presiona el icono de compartir (el cuadro con una flecha hacia arriba).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Selecciona "Agregar a pantalla de inicio" <PlusSquare className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">Desliza hacia abajo en las opciones y pulsa "Agregar a pantalla de inicio" (+).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">¡Listo!</p>
                  <p className="text-slate-500 dark:text-slate-400">Se creará el icono de LUMNI en la pantalla de tu iPhone y abrirá en modo app sin barra de navegación.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Barra de direcciones de Chrome / Edge</p>
                  <p className="text-slate-500 dark:text-slate-400">Haz clic en el icono de instalación <strong>(⊞ / ⬇)</strong> ubicado a la derecha en la barra de URL de tu navegador.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Acceso directo en tu escritorio</p>
                  <p className="text-slate-500 dark:text-slate-400">Se creará una ventana dedicada y acceso directo en Windows o Mac.</p>
                </div>
              </div>

              {deferredPrompt && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full py-2.5"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleTriggerInstall}
                  >
                    Instalar en Computadora
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Acceso rápido 1 toque</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Escáner QR optimizado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>No gasta espacio de memoria</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Actualización instantánea</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
