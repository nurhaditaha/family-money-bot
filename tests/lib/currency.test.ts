import { describe, it, expect } from 'vitest';
import { isValidCurrencyCode, normalizeCurrencyCode } from '../../src/lib/currency';

describe('isValidCurrencyCode', () => {
  it('accepts a 3-letter uppercase code', () => {
    expect(isValidCurrencyCode('SGD')).toBe(true);
  });

  it('accepts a 3-letter lowercase code', () => {
    expect(isValidCurrencyCode('sgd')).toBe(true);
  });

  it('accepts a 3-letter mixed-case code', () => {
    expect(isValidCurrencyCode('uSd')).toBe(true);
  });

  it('rejects a 2-letter code', () => {
    expect(isValidCurrencyCode('SG')).toBe(false);
  });

  it('rejects a 4-letter code', () => {
    expect(isValidCurrencyCode('SGDS')).toBe(false);
  });

  it('rejects a code with numbers', () => {
    expect(isValidCurrencyCode('SG1')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidCurrencyCode('')).toBe(false);
  });

  it('rejects a code with special characters', () => {
    expect(isValidCurrencyCode('SG-')).toBe(false);
  });
});

describe('normalizeCurrencyCode', () => {
  it('converts lowercase to uppercase', () => {
    expect(normalizeCurrencyCode('sgd')).toBe('SGD');
  });

  it('converts mixed case to uppercase', () => {
    expect(normalizeCurrencyCode('uSd')).toBe('USD');
  });

  it('preserves already uppercase codes', () => {
    expect(normalizeCurrencyCode('MYR')).toBe('MYR');
  });
});
