import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCw, Search, Lock, Unlock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { db } from '../config/firebase';
import { listTeachers, updateTeacherAccount } from '../services/teacherAdmin';
import { accountStatus } from '../utils/account';
import type { UserProfile } from '../types';

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const STATUS_STYLE = {
  activo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  bloqueado: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  vencido: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
} as const;

/** Panel del creador: maestros registrados, su uso y bloqueo de cuentas. Solo ve datos de la cuenta, no de los alumnos. */
export const AdminView: React.FC = () => {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError('');
    try {
      setTeachers(await listTeachers(db));
    } catch {
      setError('No se pudo cargar la lista. ¿Publicaste las reglas de Firestore y existe tu documento en admins?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = async (t: UserProfile) => {
    if (!db) return;
    const blocking = t.estado !== 'bloqueado';
    if (blocking && !window.confirm(`¿Bloquear la cuenta de ${t.nombre} (${t.email})? Ya no podrá iniciar sesión ni guardar datos.`)) return;
    setBusyId(t.id);
    try {
      await updateTeacherAccount(db, t.id, { estado: blocking ? 'bloqueado' : 'activo' });
      setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, estado: blocking ? 'bloqueado' : 'activo' } : x)));
    } catch {
      setError('No se pudo actualizar la cuenta.');
    } finally {
      setBusyId(null);
    }
  };

  const setExpiry = async (t: UserProfile, value: string) => {
    if (!db) return;
    setBusyId(t.id);
    try {
      await updateTeacherAccount(db, t.id, { vigenteHasta: value });
      setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, vigenteHasta: value } : x)));
    } catch {
      setError('No se pudo guardar la vigencia.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return teachers.filter((t) => `${t.nombre} ${t.apellidos || ''} ${t.email} ${t.colegio || ''}`.toLowerCase().includes(q));
  }, [teachers, search]);

  const totals = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: teachers.length,
      activos7d: teachers.filter((t) => t.ultimaActividad && new Date(t.ultimaActividad).getTime() > weekAgo).length,
      alumnos: teachers.reduce((n, t) => n + (t.numAlumnos || 0), 0),
      bloqueados: teachers.filter((t) => t.estado === 'bloqueado').length,
    };
  }, [teachers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-app-primary">Administrador</h1>
            <p className="text-xs text-app-muted">Maestros registrados y uso de la plataforma. No incluye datos de alumnos.</p>
          </div>
        </div>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Maestros', totals.total],
          ['Activos (7 días)', totals.activos7d],
          ['Alumnos en total', totals.alumnos],
          ['Bloqueados', totals.bloqueados],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-4">
            <p className="text-[11px] uppercase tracking-wider text-app-muted font-bold">{label}</p>
            <p className="text-2xl font-bold text-app-primary mt-1">{value}</p>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o escuela"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-app-muted uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              {['Maestro', 'Escuela', 'Registro', 'Último ingreso', 'Ingresos', 'Alumnos', 'Vigente hasta', 'Estado', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const status = accountStatus(t);
              return (
                <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/60 align-middle">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-app-primary">{t.nombre} {t.apellidos || ''}</p>
                    <p className="text-app-muted">{t.email}</p>
                  </td>
                  <td className="px-4 py-3">{t.colegio || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.ultimoIngreso)}</td>
                  <td className="px-4 py-3">{t.ingresos || 0}</td>
                  <td className="px-4 py-3">{t.numAlumnos ?? '—'}</td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      defaultValue={t.vigenteHasta || ''}
                      disabled={busyId === t.id}
                      onBlur={(e) => e.target.value !== (t.vigenteHasta || '') && setExpiry(t, e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[status]}`}>{status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleBlock(t)}
                      disabled={busyId === t.id}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer disabled:opacity-50"
                    >
                      {t.estado === 'bloqueado' ? <><Unlock className="w-3.5 h-3.5" /> Activar</> : <><Lock className="w-3.5 h-3.5" /> Bloquear</>}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-app-muted">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
