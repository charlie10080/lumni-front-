import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from '../ui/Button';

export const MobileAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already running as installed standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if user dismissed recently (24h)
    const dismissedUntil = localStorage.getItem('lumni_pwa_dismissed');
    if (dismissedUntil && parseInt(dismissedUntil, 10) > Date.now()) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    if (isAppleMobile) {
      // Show install banner on mobile iOS after 3 seconds
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Dismiss for 48 hours
    localStorage.setItem('lumni_pwa_dismissed', (Date.now() + 48 * 60 * 60 * 1000).toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up">
      <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-indigo-500/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-indigo-500/15 blur-xl pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          title="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Instalar App LUMNI Móvil</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">
                PWA
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Úsalo como App en tu teléfono: acceso rápido sin escribir la dirección y escáner QR a pantalla completa.
            </p>
          </div>
        </div>

        {showIOSInstructions ? (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              1. Toca el botón "Compartir" en la barra inferior de Safari.
            </p>
            <p className="font-bold flex items-center gap-1.5">
              <PlusSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              2. Selecciona "Agregar a pantalla de inicio".
            </p>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold underline mt-1 cursor-pointer block text-right w-full"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
            <button
              onClick={handleDismiss}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 px-2 py-1 cursor-pointer"
            >
              Más tarde
            </button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleInstallClick}
              className="py-1.5 text-xs font-bold shadow-md shadow-indigo-600/20"
            >
              Instalar en Teléfono
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
