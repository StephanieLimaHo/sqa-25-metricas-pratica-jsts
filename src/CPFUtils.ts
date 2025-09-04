export type CPF = string;

const CPF_LENGTH = 11 as const;
const D1_START = 10 as const;
const D2_START = 11 as const;

const INVALID = new Set<string>([
  '00000000000','11111111111','22222222222','33333333333','44444444444',
  '55555555555','66666666666','77777777777','88888888888','99999999999'
]);

function onlyDigits(v: string): string { return v.replace(/\D/g, ''); }
function isInvalid(v: string): boolean { return INVALID.has(v); }

/* Calcula DV do CPF via soma ponderada decrescente e regra do módulo 11. */
function calcDigit(base: string, start: number): number {
  let sum = 0;
  for (let i = 0; i < base.length; i += 1) { sum += Number(base[i]) * (start - i); }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

function ensureLen(d: string): void {
  if (d.length !== CPF_LENGTH) { throw new Error('CPF deve ter 11 dígitos'); }
}

/* Valida formato, remove máscara, aplica blacklist e confere DVs. */
function validateCPF(raw: CPF): boolean {
  if (raw === null || raw === undefined) { throw new Error('CPF inválido'); }
  if (typeof raw !== 'string') { throw new Error('CPF inválido'); }
  const c = onlyDigits(raw);
  if (c.length !== CPF_LENGTH) { return false; }
  if (isInvalid(c)) { return false; }
  const b9 = c.slice(0, 9);
  const d1 = calcDigit(b9, D1_START);
  const d2 = calcDigit(b9 + String(d1), D2_START);
  return c === b9 + String(d1) + String(d2);
}

function maskCPF(raw: CPF): string {
  if (typeof raw !== 'string') { throw new Error('CPF deve ser uma string'); }
  const d = onlyDigits(raw);
  ensureLen(d);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function unmaskCPF(raw: CPF): string {
  if (typeof raw !== 'string') { throw new Error('CPF deve ser uma string'); }
  const d = onlyDigits(raw);
  ensureLen(d);
  return d;
}

function isValidFormat(value: string): boolean {
  if (typeof value !== 'string') { return false; }
  if (value === '') { return true; }
  const unmasked = /^\d{11}$/;
  const masked = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const partial = /^\d{0,3}(\.\d{0,3}){0,2}(-\d{0,2})?$/;
  return unmasked.test(value) || masked.test(value) || partial.test(value);
}

function generateValidCPF(): string {
  let b9 = '';
  do {
    b9 = Array.from({ length: 9 }, () => String(Math.floor(Math.random() * 10))).join('');
  } while (new Set(b9).size === 1);
  const d1 = calcDigit(b9, D1_START);
  const d2 = calcDigit(b9 + String(d1), D2_START);
  return b9 + String(d1) + String(d2);
}

export const CPFUtils = { validateCPF, maskCPF, unmaskCPF, isValidFormat, generateValidCPF };
