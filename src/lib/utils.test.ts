import { describe, it, expect } from 'vitest';
import { fmtPrice, isValidEmail, isValidPhone } from './utils';

describe('fmtPrice', () => {
  it('formats whole numbers with es-CO thousands separators', () => {
    expect(fmtPrice(1234567)).toBe('$1.234.567');
    expect(fmtPrice(0)).toBe('$0');
  });

  it('rounds decimals', () => {
    expect(fmtPrice(999.6)).toBe('$1.000');
    expect(fmtPrice(999.4)).toBe('$999');
  });
});

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('cliente@dominio.com')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('no-arroba.com')).toBe(false);
    expect(isValidEmail('sin-dominio@')).toBe(false);
    expect(isValidEmail('  ')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts 10-digit Colombian numbers, with or without +57', () => {
    expect(isValidPhone('3001234567')).toBe(true);
    expect(isValidPhone('+573001234567')).toBe(true);
    expect(isValidPhone('300 123 4567')).toBe(true);
  });

  it('rejects numbers with the wrong length or extra country codes', () => {
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('+13001234567')).toBe(false);
    expect(isValidPhone('30012345678')).toBe(false);
  });
});
