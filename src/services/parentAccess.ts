import { doc, getDoc, setDoc, deleteDoc, type Firestore } from 'firebase/firestore';
import type { Student } from '../types';
import {
  buildParentView,
  legacyParentKeys,
  normalizeKey,
  parentViewFingerprint,
  type ClassroomSnapshot,
} from '../utils/parentView';

/**
 * Acceso de padres en Firestore:
 *  - parent_views/{codigoAcceso}: vista del alumno (solo sus datos)
 *  - parent_index/{CURP}: apunta al código, para entrar con la CURP
 */

type SyncCache = Record<string, { view: string; index: string }>;

const cacheKey = (teacherId: string) => `lumni_pv_sync_${teacherId}`;

const loadCache = (teacherId: string): SyncCache => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(teacherId)) || '{}');
  } catch {
    return {};
  }
};

/** Escribe solo los alumnos cuya vista (o CURP) cambió desde la última sincronización. */
export const syncParentAccess = async (
  db: Firestore,
  teacherId: string,
  students: Student[],
  classroom: ClassroomSnapshot
): Promise<void> => {
  const cache = loadCache(teacherId);
  for (const st of students) {
    const code = normalizeKey(st.codigoAcceso);
    if (!code) continue;
    try {
      const view = buildParentView(teacherId, st, classroom);
      const viewHash = parentViewFingerprint(view);
      const curp = normalizeKey(st.curp);
      const indexSig = `${code}|${curp}`;
      const prev = cache[st.id];

      if (prev?.view !== viewHash) await setDoc(doc(db, 'parent_views', code), view);
      if (curp && prev?.index !== indexSig) await setDoc(doc(db, 'parent_index', curp), { code, teacherId });

      cache[st.id] = { view: viewHash, index: indexSig };
    } catch (err) {
      console.warn('Could not sync parent access for student:', st.id, err);
    }
  }
  localStorage.setItem(cacheKey(teacherId), JSON.stringify(cache));
};

/** Revoca el acceso de los padres a un alumno (al darlo de baja). */
export const removeParentAccess = async (db: Firestore, student: Student): Promise<void> => {
  const code = normalizeKey(student.codigoAcceso);
  const curp = normalizeKey(student.curp);
  const deletions = [code && doc(db, 'parent_views', code), curp && doc(db, 'parent_index', curp)].filter(Boolean);
  for (const ref of deletions) {
    try {
      await deleteDoc(ref as ReturnType<typeof doc>);
    } catch (err) {
      console.warn('Could not remove parent access:', err);
    }
  }
};

/**
 * Una sola vez por docente: borra las vistas antiguas que estaban bajo CURP o matrícula.
 * Quedaban desactualizadas y la matrícula (secuencial) se puede adivinar.
 */
export const migrateLegacyParentKeys = async (db: Firestore, teacherId: string, students: Student[]): Promise<void> => {
  const flag = `lumni_pv_migrated_${teacherId}`;
  if (localStorage.getItem(flag)) return;
  let failed = false;
  for (const st of students) {
    for (const key of legacyParentKeys(st)) {
      try {
        const ref = doc(db, 'parent_views', key);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().teacherId === teacherId) await deleteDoc(ref);
      } catch (err) {
        failed = true;
        console.warn('Legacy parent view cleanup failed:', key, err);
      }
    }
  }
  if (!failed) localStorage.setItem(flag, '1');
};
