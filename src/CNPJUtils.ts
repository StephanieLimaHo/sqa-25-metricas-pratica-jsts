export type CNPJ = string;

const CNPJ_LENGTH = 14 as const;
const MOD_BASE = 11 as const;
const MOD_THRESHOLD = 2 as const;
const BRANCH_SUFFIX = '0001';
const ROOT_LENGTH = 8 as const;
const BASE12_LEN = 12 as const;

/* Pesos oficiais do CNPJ para cálculo dos dígitos (módulo 11). */
const W_D1: readonly number[] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W_D2: readonly number[] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

const IDX_02 = 2 as const;
const IDX_05 = 5 as const;
const IDX_08 = 8 as const;
const IDX_12 = 12 as const;

const INVALID = new Set<string>([
  '00000000000000','11111111111111','22222222222222','33333333333333',
  '44444444444444','55555555555555','66666666666666','77777777777777',
  '88888888888888','99999999999999'
]);

function onlyDigits(v: string): string { return v.replace(/\D/g, ''); }
function isInvalid(v: string): boolean { return INVALID.has(v); }

/* Calcula um dígito verificador via soma ponderada e (sum % 11) -> regra do CNPJ. */
function calcDigit(base: string, weights: readonly number[]): number {
  const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const mod = sum % MOD_BASE;
  return mod < MOD_THRESHOLD ? 0 : MOD_BASE - mod;
}

function ensureLen(d: string): void {
  if (d.length !== CNPJ_LENGTH) { throw new Error('CNPJ deve ter 14 dígitos'); }
}

function randomDigit(): number { return Math.floor(Math.random() * 10); }

function validateCNPJ(raw: CNPJ): boolean {
  if (raw === null || raw === undefined) { throw new Error('CNPJ inválido'); }
  if (typeof raw !== 'string') { throw new Error('CNPJ inválido'); }
  const c = onlyDigits(raw);
  if (c.length !== CNPJ_LENGTH) { return false; }
  if (isInvalid(c)) { return false; }
  const b12 = c.slice(0, BASE12_LEN);
  const d1 = calcDigit(b12, W_D1);
  const b13 = b12 + String(d1);
  const d2 = calcDigit(b13, W_D2);
  return c === b13 + String(d2);
}

function maskCNPJ(raw: CNPJ): string {
  if (typeof raw !== 'string') { throw new Error('CNPJ deve ser uma string'); }
  const d = onlyDigits(raw);
  ensureLen(d);
  const p1 = d.slice(0, IDX_02);
  const p2 = d.slice(IDX_02, IDX_05);
  const p3 = d.slice(IDX_05, IDX_08);
  const p4 = d.slice(IDX_08, IDX_12);
  const p5 = d.slice(IDX_12);
  return `${p1}.${p2}.${p3}/${p4}-${p5}`;
}

function unmaskCNPJ(raw: CNPJ): string {
  if (typeof raw !== 'string') { throw new Error('CNPJ deve ser uma string'); }
  const d = onlyDigits(raw);
  ensureLen(d);
  return d;
}

function isValidFormat(value: string): boolean {
  if (typeof value !== 'string') { return false; }
  if (value === '') { return true; }
  const unmasked = /^\d{14}$/;
  const masked = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  const partial = /^\d{0,2}(\.\d{0,3}){0,2}(\/\d{0,4})?(-\d{0,2})?$/;
  return unmasked.test(value) || masked.test(value) || partial.test(value);
}

/* Gera CNPJ válido evitando sequências repetidas e usando filial padrão '0001'. */
function generateValidCNPJ(): string {
  let b12 = '';
  do {
    const root = Array.from({ length: ROOT_LENGTH }, () => String(randomDigit())).join('');
    b12 = root + BRANCH_SUFFIX;
  } while (new Set(b12).size === 1);
  const d1 = calcDigit(b12, W_D1);
  const d2 = calcDigit(b12 + String(d1), W_D2);
  const cnpj = b12 + String(d1) + String(d2);
  if (isInvalid(cnpj)) { return generateValidCNPJ(); }
  return cnpj;
}

export const CNPJUtils = { validateCNPJ, maskCNPJ, unmaskCNPJ, isValidFormat, generateValidCNPJ };
