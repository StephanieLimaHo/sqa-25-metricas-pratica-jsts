const MIN = 8 as const;
const MAX = 128 as const;

/* Exige maiúscula, minúscula, dígito e símbolo (sem espaço). */
function hasComposition(pwd: string): boolean {
  const rules = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9\s]/];
  return rules.every((r) => r.test(pwd));
}

/* Bloqueia runs como 'aaa' ou '111' (3+ repetidos). */
function hasRepeatingRun(pwd: string): boolean { return /(.)\1{2,}/.test(pwd); }

/* Bloqueia sequências numéricas óbvias (ex.: 123, 456...). */
function hasNumericSequence(pwd: string): boolean {
  const digits = pwd.replace(/\D/g, '');
  for (let i = 0; i + 2 < digits.length; i += 1) {
    const a = digits.charCodeAt(i);
    const b = digits.charCodeAt(i + 1);
    const c = digits.charCodeAt(i + 2);
    const asc = b === a + 1 && c === b + 1;
    const desc = b === a - 1 && c === b - 1;
    if (asc || desc) { return true; }
  }
  return false;
}

function hasForbiddenPatterns(pwd: string): boolean { return /abc|qwe|asd|zxc/i.test(pwd); }

export function validatePassword(password: string): boolean {
  if (password === null || password === undefined) { throw new Error('Senha inválida'); }
  if (typeof password !== 'string') { throw new Error('Senha inválida'); }
  const pwd = password;
  const validators = [
    () => pwd.length >= MIN && pwd.length <= MAX,
    () => hasComposition(pwd),
    () => !hasRepeatingRun(pwd),
    () => !hasNumericSequence(pwd),
    () => !hasForbiddenPatterns(pwd)
  ];
  return validators.every((fn) => fn());
}
