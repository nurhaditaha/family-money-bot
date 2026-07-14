/**
 * Validates if a string is a valid ISO 4217 currency code format.
 * Must be exactly 3 letters (a-z, A-Z).
 *
 * @param code - The currency code to validate
 * @returns true if valid, false otherwise
 */
export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Za-z]{3}$/.test(code);
}

/**
 * Normalizes a currency code to uppercase.
 * Does NOT validate the code format — use isValidCurrencyCode for validation.
 *
 * @param code - The currency code to normalize
 * @returns The uppercase version of the code
 */
export function normalizeCurrencyCode(code: string): string {
  return code.toUpperCase();
}
