import type { UserProfile } from '../types';

export type AccountStatus = 'activo' | 'bloqueado' | 'vencido';

/** Estado efectivo de la cuenta de un maestro: bloqueada por el administrador o con vigencia vencida. */
export const accountStatus = (
  profile: Pick<UserProfile, 'estado' | 'vigenteHasta'>,
  today: string = new Date().toISOString().split('T')[0]
): AccountStatus => {
  if (profile.estado === 'bloqueado') return 'bloqueado';
  if (profile.vigenteHasta && profile.vigenteHasta < today) return 'vencido';
  return 'activo';
};

export const ACCOUNT_BLOCKED_MESSAGE =
  'Tu cuenta está bloqueada o su vigencia terminó. Comunícate con soporte de LUMNI para reactivarla.';

/** Segundos de espera mínimos entre reportes de uso, para no gastar escrituras. */
export const USAGE_REPORT_INTERVAL_MS = 30 * 60 * 1000;
