import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  ShieldCheck,
  Lock,
  Database,
  Share2,
  Trash2,
  FileText,
  UserCheck,
  CheckCircle2,
  Building,
  CreditCard,
  HeartHandshake,
} from 'lucide-react';

export interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeleteAccount?: () => void;
}

type TabType = 'resumen' | 'datos' | 'finalidades' | 'terceros' | 'olvido' | 'seguridad';

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'resumen', label: '1. Resumen & Responsable', icon: ShieldCheck },
    { id: 'datos', label: '2. Datos que Recopilamos', icon: Database },
    { id: 'finalidades', label: '3. Para qué se Usan', icon: FileText },
    { id: 'terceros', label: '4. Terceros & Pasarelas', icon: Share2 },
    { id: 'olvido', label: '5. Derecho al Olvido', icon: Trash2 },
    { id: 'seguridad', label: '6. Cifrado & Menores', icon: Lock },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aviso de Privacidad & Protección de Datos Personales"
      maxWidth="4xl"
    >
      <div className="space-y-6 text-slate-700 dark:text-slate-300">
        {/* Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  LUMNI — Compromiso con la Privacidad Escolar
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Vigente 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cumplimiento con la LFPDPPP, directrices de la SEP y estándares internacionales de protección a la infancia (COPPA/GDPR).
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Última actualización: <strong>26 de Septiembre de 2026</strong>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[300px] text-xs sm:text-sm leading-relaxed space-y-4">
          {/* TAB 1: RESUMEN & RESPONSABLE */}
          {activeTab === 'resumen' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  1. Identidad y Domicilio del Responsable
                </h4>
                <p>
                  <strong>LUMNI Sistema de Gestión Escolar</strong> (en adelante, &quot;LUMNI&quot; o &quot;la Plataforma&quot;) es una solución tecnológica educativa diseñada para asistir a docentes, directivos, estudiantes y tutores legales en el control escolar, pase de lista, evaluación académica continua y comunicación institucional.
                </p>
                <p>
                  Para cualquier duda, solicitud o ejercicio de tus derechos de privacidad, ponemos a tu disposición nuestro buzón oficial de protección de datos:
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold ml-1.5">
                    privacidad@lumni.app
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Principio de Minimización
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Solo solicitamos y almacenamos los datos estrictamente necesarios para emitir boletas oficiales, llevar la asistencia del grupo y contactar al tutor en caso de urgencia escolar.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                  <p className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" /> Cero Venta de Información
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    LUMNI <strong>NO</strong> vende, no comercializa ni arrienda datos personales de estudiantes o profesores a intermediarios publicitarios, analíticos de mercado ni terceros.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATOS QUE RECOPILAMOS */}
          {activeTab === 'datos' && (
            <div className="space-y-4 animate-fade-in">
              <p>
                Declaramos con total transparencia las categorías de información tratadas por la plataforma según el perfil del usuario:
              </p>

              <div className="space-y-3">
                {/* Docentes */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center text-xs">
                      👨‍🏫
                    </span>
                    <span>A. Datos del Docente o Titular de Aula:</span>
                  </div>
                  <ul className="list-disc pl-7 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <li>Nombre completo y apellidos.</li>
                    <li>Correo electrónico oficial de acceso y autenticación.</li>
                    <li>Nombre del plantel escolar y Clave de Centro de Trabajo (C.C.T.).</li>
                    <li>Grado, grupo asignado y ciclo escolar vigente.</li>
                    <li>Estado y periodicidad de su suscripción docente.</li>
                  </ul>
                </div>

                {/* Alumnos */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs">
                      🎒
                    </span>
                    <span>B. Datos de los Estudiantes (Menores de Edad):</span>
                  </div>
                  <ul className="list-disc pl-7 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <li>Nombre completo, apellidos y género.</li>
                    <li>Clave Única de Registro de Población (CURP) oficial y/o Matrícula escolar interna.</li>
                    <li>Registro diario de asistencias, retardos, faltas justificadas y observaciones.</li>
                    <li>Calificaciones numéricas trimestrales y formativas por materia (SEP / NEM).</li>
                    <li>Reportes de incidencias disciplinarias o menciones de conducta.</li>
                    <li>Identificador único para el código QR de su credencial digital de acceso.</li>
                  </ul>
                </div>

                {/* Tutores */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs">
                      👨‍👩‍👧
                    </span>
                    <span>C. Datos del Padre, Madre o Tutor Legal:</span>
                  </div>
                  <ul className="list-disc pl-7 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <li>Nombre del tutor y parentesco con el alumno.</li>
                    <li>Número de teléfono celular (para llamadas de emergencia y enlace directo de WhatsApp).</li>
                    <li>Correo electrónico de contacto (opcional).</li>
                    <li>Historial de mensajes e intercambios dentro de la bandeja de chat del aula.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PARA QUÉ SE USAN (FINALIDADES) */}
          {activeTab === 'finalidades' && (
            <div className="space-y-4 animate-fade-in">
              <p>
                Los datos personales recopilados se destinan <strong>exclusivamente a finalidades educativas, organizacionales y pedagógicas</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">1. Pase de Lista y Control de Asistencia</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Registro matutino mediante escáner QR o lista nominal para contabilizar puntualidad y porcentajes de asistencia por ciclo.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">2. Evaluación y Boletas Oficiales</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Cálculo automático de promedios trimestrales y generación de reportes y boletas en PDF listas para firma y entrega formal.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">3. Comunicación Directa con la Familia</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Envío de circulares, avisos escolares y mensajería privada entre docente y tutores sobre el desempeño del menor.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">4. Respaldo y Portabilidad Docente</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Permitir la descarga completa del historial en formatos abiertos (JSON y Excel .xlsx) para archivo físico o digital del profesor.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs">
                <strong>🚫 Prácticas Prohibidas en LUMNI:</strong> Queda terminantemente prohibido el rastreo conductual con fines publicitarios, la venta de perfiles a terceros y el envío de comunicaciones comerciales no solicitadas.
              </div>
            </div>
          )}

          {/* TAB 4: TERCEROS Y PASARELAS */}
          {activeTab === 'terceros' && (
            <div className="space-y-4 animate-fade-in">
              <p>
                Para brindar un servicio de alta disponibilidad y seguridad sin costos desmedidos, interactuamos únicamente con los siguientes proveedores esenciales de infraestructura bajo estrictos convenios de confidencialidad:
              </p>

              <div className="space-y-3">
                {/* Firebase */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm">Google Firebase / Cloud Platform</strong>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Base de Datos & Auth
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      Utilizamos Firebase Authentication y Cloud Firestore para el inicio de sesión cifrado y la sincronización en tiempo real del aula. Los servidores de Google cuentan con certificaciones internacionales ISO 27001, SOC 2 y cifrado de datos en reposo mediante AES-256.
                    </p>
                  </div>
                </div>

                {/* Pasarelas de Pago */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm">Pasarelas de Pago Certificadas (PCI-DSS)</strong>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Suscripciones
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      El procesamiento de cobros (inscripción y cuota mensual de $50 MXN) es realizado por plataformas de pago certificadas (como Stripe o Mercado Pago). <strong>LUMNI jamás recopila, almacena ni visualiza números de tarjetas de crédito o cuentas bancarias</strong>. La transacción ocurre íntegramente en los servidores certificados del procesador.
                    </p>
                  </div>
                </div>

                {/* Procesamiento en el Cliente */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm">Motor Local del Navegador (Sin APIs Externas de Conversión)</strong>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                        100% On-Device
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      La generación de boletas oficiales en PDF (<code className="font-mono">jspdf</code>), la exportación de hojas de cálculo (<code className="font-mono">xlsx</code>) y el escaneo de códigos QR se ejecutan localmente en la memoria del dispositivo del usuario. No enviamos las calificaciones a servidores externos de renderizado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DERECHO AL OLVIDO & DERECHOS ARCO */}
          {activeTab === 'olvido' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  Derecho al Olvido & Eliminación Definitiva de Cuenta
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  En cumplimiento del <strong>Derecho al Olvido</strong> y de los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), todo docente o usuario titular de una cuenta en LUMNI tiene la facultad inalienable de solicitar y ejecutar el borrado total e irreversible de su expediente escolar y de todos los registros asociados.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">
                  ¿Qué ocurre exactamente cuando solicitas la eliminación de tu cuenta?
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Se elimina de forma permanente tu perfil de usuario y credenciales de acceso de Firebase Auth.</li>
                  <li>Se borra de manera definitiva la base de datos de tu aula (<code className="font-mono">classrooms</code>), incluyendo alumnos, notas, asistencias, avisos e historial de incidencias.</li>
                  <li>Se desvinculan y destruyen las claves de acceso de los tutores vinculados (<code className="font-mono">student_lookup</code>).</li>
                  <li>Se limpian todas las copias de seguridad temporales en la memoria local (<code className="font-mono">localStorage</code>) del navegador.</li>
                  <li>Esta acción es <strong>inmediata e irrevocable</strong>, sin periodos de retención oculta de datos.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    ¿Deseas ejercer tu Derecho al Olvido ahora mismo?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Puedes proceder directamente desde el panel de ajustes de tu cuenta.
                  </p>
                </div>
                {onOpenDeleteAccount && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30 whitespace-nowrap"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      onClose();
                      onOpenDeleteAccount();
                    }}
                  >
                    Eliminar mi Cuenta y Datos
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CIFRADO & PROTECCIÓN DE MENORES */}
          {activeTab === 'seguridad' && (
            <div className="space-y-4 animate-fade-in">
              <p>
                La protección de los menores de edad y la integridad de su expediente académico es la máxima prioridad en la arquitectura técnica de LUMNI:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Cifrado TLS 1.3 & AES-256</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Toda la comunicación entre tu navegador o teléfono y nuestros servicios viaja mediante canales seguros HTTPS con cifrado TLS 1.3. Las bases de datos en reposo están protegidas con el estándar militar AES-256.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Aislamiento Estricto por Tutor (RBAC)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Los padres y tutores solo tienen autorización para consultar la boleta, asistencias y mensajes correspondientes a su propio hijo. Nunca tienen acceso a los expedientes de otros compañeros del aula.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Auditorías y Reglas de Seguridad en Servidor
                </p>
                <p>
                  Nuestras reglas de seguridad en Cloud Firestore impiden que cualquier usuario no autenticado o sin privilegios de docente titular pueda sobrescribir calificaciones, alterar listas de asistencia o modificar el historial disciplinario del plantel.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> Tus datos están protegidos conforme a la ley
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Entendido y Aceptar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
