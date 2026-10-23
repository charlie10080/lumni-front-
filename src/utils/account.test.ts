import { describe, expect, it } from 'vitest';
import { accountStatus } from './account';

describe('accountStatus', () => {
  it('es activo sin estado ni vigencia', () => {
    expect(accountStatus({}, '2026-10-23')).toBe('activo');
  });
  it('bloqueado gana sobre la vigencia', () => {
    expect(accountStatus({ estado: 'bloqueado', vigenteHasta: '2099-01-01' }, '2026-10-23')).toBe('bloqueado');
  });
  it('vencido solo cuando la fecha ya pasó', () => {
    expect(accountStatus({ vigenteHasta: '2026-10-22' }, '2026-10-23')).toBe('vencido');
    expect(accountStatus({ vigenteHasta: '2026-10-23' }, '2026-10-23')).toBe('activo');
  });
});
