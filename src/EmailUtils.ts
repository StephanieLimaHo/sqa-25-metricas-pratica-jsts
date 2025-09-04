export type Email = string;

/* Limites de tamanho comuns (local ≤64, domínio ≤253, total ≤254). */
const MAX_EMAIL = 254 as const;
const MAX_LOCAL = 64 as const;
const MAX_DOMAIN = 253 as const;
const MAX_LABEL = 63 as const;

function basicFormat(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(email);
}

function splitEmail(email: string): { local: string; domain: string } | null {
  const parts = email.split('@');
  if (parts.length !== 2) { return null; }
  return { local: parts[0], domain: parts[1] };
}

function isValidEmailLength(full: string): boolean { return full.length <= MAX_EMAIL; }
function isValidLocalLength(local: string): boolean { return local.length > 0 && local.length <= MAX_LOCAL; }
function isValidDomainLength(domain: string): boolean { return domain.length > 0 && domain.length <= MAX_DOMAIN; }
function isValidLabelLengths(domain: string): boolean {
  const labels = domain.split('.');
  return !labels.some((l) => l.length === 0 || l.length > MAX_LABEL);
}

/* Rótulos do domínio não podem iniciar/terminar com '-' nem exceder 63 chars. */
function validateLengths(local: string, domain: string, full: string): boolean {
  return isValidEmailLength(full) && isValidLocalLength(local) && isValidDomainLength(domain) && isValidLabelLengths(domain);
}

function invalidLocalRules(local: string): boolean {
  if (local.startsWith('.')) { return true; }
  if (local.endsWith('.')) { return true; }
  if (local.includes('..')) { return true; }
  return false;
}

function invalidDomainRules(domain: string): boolean {
  if (domain.startsWith('.')) { return true; }
  if (domain.endsWith('.')) { return true; }
  if (domain.startsWith('-')) { return true; }
  if (domain.endsWith('-')) { return true; }
  if (domain.includes('..')) { return true; }
  return false;
}

function validateEmail(email: Email): boolean {
  if (typeof email !== 'string') { return false; }
  const trimmed = email.trim();
  const parts = splitEmail(trimmed);
  if (!parts) { return false; }
  const { local, domain } = parts;
  const rules = [
    () => basicFormat(trimmed),
    () => !invalidLocalRules(local),
    () => !invalidDomainRules(domain),
    () => validateLengths(local, domain, trimmed)
  ];
  return rules.every((fn) => fn());
}

function normalizeEmail(email: Email): string {
  if (email === null || email === undefined) { throw new Error('Email inválido'); }
  if (typeof email !== 'string') { throw new Error('Email inválido'); }
  return email.trim().toLowerCase();
}

function extractDomain(email: Email): string | null {
  if (typeof email !== 'string') { return null; }
  const parts = splitEmail(email.trim());
  return parts ? parts.domain : null;
}

function extractLocalPart(email: Email): string | null {
  if (typeof email !== 'string') { return null; }
  const parts = splitEmail(email.trim());
  return parts ? parts.local : null;
}

function isFromDomain(email: Email, domain: string): boolean {
  if (typeof domain !== 'string' || domain.trim() === '') { return false; }
  const dom = extractDomain(email);
  if (!dom) { return false; }
  const d = dom.toLowerCase();
  const target = domain.toLowerCase();
  if (d === target) { return true; }
  return d.endsWith(`.${target}`);
}

export const EmailUtils = { validateEmail, normalizeEmail, extractDomain, extractLocalPart, isFromDomain };
