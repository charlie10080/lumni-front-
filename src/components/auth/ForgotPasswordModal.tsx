import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const success = await sendPasswordReset(email);
    setIsSubmitting(false);

    if (success) {
      setIsSent(true);
    }
  };

  const handleClose = () => {
    setIsSent(false);
    setEmail('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Recuperar Contraseña" maxWidth="md">
      {isSent ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">¡Enlace Enviado con Éxito!</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
              Hemos enviado las instrucciones para restablecer tu contraseña a <strong className="text-slate-900 dark:text-white">{email}</strong>. Por favor revisa tu bandeja de entrada o carpeta de spam.
            </p>
          </div>
          <Button variant="primary" className="w-full mt-2" onClick={handleClose}>
            Entendido, Volver al Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ingresa el correo electrónico asociado a tu cuenta escolar y te enviaremos un enlace seguro para crear una nueva contraseña.
          </p>

          <Input
            label="Correo Electrónico Institucional"
            type="email"
            required
            placeholder="ejemplo@lumni.edu.mx"
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Enviar Instrucciones
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
