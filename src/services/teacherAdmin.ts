import { collection, doc, getDoc, getDocs, increment, updateDoc, type Firestore } from 'firebase/firestore';
import type { UserProfile } from '../types';
import { USAGE_REPORT_INTERVAL_MS } from '../utils/account';

/** ¿El usuario es administrador? Existe el documento admins/{uid} (se crea a mano en la consola de Firebase). */
export const checkIsAdmin = async (db: Firestore, uid: string): Promise<boolean> => {
  try {
    return (await getDoc(doc(db, 'admins', uid))).exists();
  } catch {
    return false;
  }
};

/** Perfil del maestro en Firestore (incluye estado y vigencia). */
export const fetchTeacherProfile = async (db: Firestore, uid: string): Promise<Partial<UserProfile> | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as Partial<UserProfile>) : null;
  } catch {
    return null;
  }
};

export const reportLogin = (db: Firestore, uid: string): void => {
  updateDoc(doc(db, 'users', uid), { ultimoIngreso: new Date().toISOString(), ingresos: increment(1) }).catch((e) =>
    console.warn('Could not report login:', e)
  );
};

/** Registra cuántos alumnos tiene y cuándo fue la última actividad; como máximo una vez cada 30 minutos. */
export const reportUsage = (db: Firestore, uid: string, numAlumnos: number): void => {
  const key = `lumni_usage_report_${uid}`;
  try {
    const last = JSON.parse(localStorage.getItem(key) || '{}') as { at?: number; n?: number };
    if (last.n === numAlumnos && last.at && Date.now() - last.at < USAGE_REPORT_INTERVAL_MS) return;
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), n: numAlumnos }));
  } catch {
    // sin localStorage se reporta siempre
  }
  updateDoc(doc(db, 'users', uid), { numAlumnos, ultimaActividad: new Date().toISOString() }).catch((e) =>
    console.warn('Could not report usage:', e)
  );
};

/** Solo administradores: todos los maestros registrados. */
export const listTeachers = async (db: Firestore): Promise<UserProfile[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => ({ ...(d.data() as UserProfile), id: d.id }))
    .filter((u) => u.rol === 'teacher')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

/** Solo administradores: bloquear/activar y fijar vigencia o nota. */
export const updateTeacherAccount = async (
  db: Firestore,
  uid: string,
  changes: { estado?: 'activo' | 'bloqueado'; vigenteHasta?: string; notaAdmin?: string }
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), changes);
};
