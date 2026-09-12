import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface LiveQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  lastScannedStudent?: string | null;
}

export const LiveQrScanner: React.FC<LiveQrScannerProps> = ({ onScanSuccess, lastScannedStudent }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'lumni-qr-reader';

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        onScanSuccess(decodedText);
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        qrCodeSuccessCallback,
        undefined
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Asegúrate de otorgar permisos o utiliza el simulador rápido inferior.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.warn('Error stopping scanner', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Box */}
      <div className="relative rounded-3xl bg-slate-950 border-2 border-slate-800 overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-4">
        {/* HTML5 QR Container */}
        <div id={readerElementId} className="w-full max-w-sm rounded-2xl overflow-hidden" />

        {!isScanning && (
          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Lector de Credenciales Escolares QR</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Haz clic en el botón para activar la cámara de tu equipo y registrar la asistencia de tus alumnos al instante.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={<Camera className="w-4 h-4" />}
              onClick={startScanner}
            >
              Encender Cámara
            </Button>
          </div>
        )}

        {isScanning && (
          <div className="mt-3 flex items-center justify-between w-full max-w-sm px-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Escaneando en vivo...
            </span>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CameraOff className="w-3.5 h-3.5 text-rose-400" />}
              onClick={stopScanner}
            >
              Apagar Cámara
            </Button>
          </div>
        )}

        {cameraError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2 max-w-sm mt-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {lastScannedStudent && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 animate-fade-in shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
          <div className="text-xs">
            <p className="font-extrabold text-white text-sm">¡Asistencia Registrada con Éxito!</p>
            <p className="text-emerald-300">{lastScannedStudent} • {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
