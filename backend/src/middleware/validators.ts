const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[0-9]{7,15}$/;

export function isNonNegativeNumber(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0;
}

export function isPositiveInteger(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

export function isValidEmail(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true; // email is optional
  return EMAIL_PATTERN.test(String(value));
}

export function isValidMobile(value: unknown): boolean {
  return MOBILE_PATTERN.test(String(value || '').trim());
}
