import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Student, SchoolInfo } from '../../types';
import { Printer } from 'lucide-react';

interface StudentCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  schoolInfo: SchoolInfo;
}

export const StudentCredentialModal: React.FC<StudentCredentialModalProps> = ({
  isOpen,
  onClose,
  student,
  schoolInfo,
}) => {
  if (!student) return null;

  // Generate QR Code URL via public SVG/API — subimos resolución para que no se vea pixeleado al agrandar/imprimir
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    student.matricula
  )}&bgcolor=ffffff&color=0f172a&margin=6`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credencial del Estudiante" maxWidth="md">
      <div className="space-y-6">
        {/* Printable Card Area - Styled as a Professional Plastic/Laminated Badge */}
        <div
          id="student-credential-card"
          className="print-credential-target relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 shadow-2xl border-2 border-indigo-500/40"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-400 flex items-center justify-center font-bold text-white shadow-md text-xs shrink-0">
                L
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold uppercase tracking-tight text-white leading-tight truncate">
                  {schoolInfo.nombre}
                </h4>
                <p className="text-[10px] text-indigo-300 font-semibold">
                  C.C.T. {schoolInfo.cct} • Ciclo {schoolInfo.ciclo}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase shrink-0">
              Estudiante
            </span>
          </div>

          {/* Student Info & Photo & QR Grid */}
          <div className="grid grid-cols-3 gap-3 items-center mb-3">
            {/* Left: Avatar / Photo */}
            <div className="col-span-1 flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-lg ring-2 ring-indigo-400/40 mb-1">
                {student.nombre.charAt(0)}
              </div>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">● Vigente</span>
            </div>

            {/* Center: Details */}
            <div className="col-span-2 space-y-1 text-xs">
              <p className="text-[9px] uppercase font-semibold text-slate-400">Nombre del Alumno</p>
              <p className="font-extrabold text-white text-sm leading-tight">
                {student.nombre} {student.apellidos}
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <div>
                  <p className="text-[8px] uppercase text-slate-400">Grado / Grupo</p>
                  <p className="font-bold text-white text-xs">{student.grado} "{student.grupo}"</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase text-slate-400">Turno</p>
                  <p className="font-bold text-white text-xs">{student.turno}</p>
                </div>
              </div>

              <div className="pt-0.5">
                <p className="text-[8px] uppercase text-slate-400">CURP</p>
                <p className="font-mono text-[10px] font-bold text-indigo-300">{student.curp}</p>
              </div>
            </div>
          </div>

          {/* Bottom QR Section — QR agrandado de 56px a 96px */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-indigo-500/20 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Matrícula</p>
              <p className="font-mono text-sm font-black text-white">{student.matricula}</p>
              <p className="text-[8px] text-slate-400 mt-0.5">Pase de lista matutino</p>
            </div>
            <div className="w-24 h-24 bg-white rounded-lg p-1.5 shrink-0 flex items-center justify-center shadow-md">
              <img src={qrUrl} alt={`QR ${student.matricula}`} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing via CSS) */}
        <div className="flex items-center justify-end gap-3 pt-2 no-print">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Imprimir Credencial
          </Button>
        </div>
      </div>
    </Modal>
  );
};
