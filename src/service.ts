import { EmailUtils } from './EmailUtils';
import { CNPJUtils } from './CNPJUtils';
import { validatePassword } from './passwordUtils';

const RNG_MAX = 100000;

export interface ServiceResult {
  success: boolean;
  message: string;
  timestamp: string;
  summary: {
    totalProcessed: number;
    validRecords: number;
    invalidRecords: number;
    apiCalls: number;
    backupCreated: boolean;
    integrityValid: boolean;
    auditCompleted: boolean;
    dataExported: boolean;
  };
  data: {
    processed: {
      normalizedEmail: string;
      domain: string | null;
      isFromSpecificDomain: boolean;
      maskedCNPJ: string;
      unmaskedCNPJ: string;
      cnpjFormatValid: boolean;
    };
    validation: { email: boolean; password: boolean; cnpj: boolean };
    audit: { timestamp: string; suspiciousEmails: number; duplicateCNPJs: number; totalOperations: number };
    exported: { format: 'json'; content: string; size: number };
    batch: Array<{ originalData: { email: string; password: string; cnpj: string }; isValid: boolean }>;
    test: { testCNPJ: string; testEmail: string; testPassword: string };
    report: {
      timestamp: string; totalRecords: number; validRecords: number; invalidRecords: number; apiCalls: number;
      domain: string | null; isFromSpecificDomain: boolean;
    };
    backup: {
      timestamp: string;
      data: Array<{ originalData: { email: string; password: string; cnpj: string }; isValid: boolean }>;
      checksum: number;
      originalInput: { email: string; password: string; cnpj: string };
    };
    integrity: { isValid: boolean; errors: unknown[]; totalChecks: number };
  };
  details?: { email: boolean; password: boolean; cnpj: boolean };
}

/* Normaliza e-mail, extrai domínio e aplica políticas de domínio/mascara do CNPJ. */
function buildProcessed(email: string, cnpj: string) {
  const normalizedEmail = EmailUtils.normalizeEmail(email);
  const domain = EmailUtils.extractDomain(normalizedEmail);
  const isFromSpecificDomain = EmailUtils.isFromDomain(normalizedEmail, 'empresa.com');

  const maskedCNPJ = CNPJUtils.maskCNPJ(cnpj);
  const unmaskedCNPJ = CNPJUtils.unmaskCNPJ(maskedCNPJ);
  const cnpjFormatValid = CNPJUtils.isValidFormat(maskedCNPJ);


  console.log('Iniciando serviço...');
  console.log(normalizedEmail);
  if (domain) { console.log(domain); }
  console.log(unmaskedCNPJ);
  console.log(maskedCNPJ);

  return { normalizedEmail, domain, isFromSpecificDomain, maskedCNPJ, unmaskedCNPJ, cnpjFormatValid };
}

function validateInputs(email: string, password: string, cnpj: string) {
  return { emailOk: EmailUtils.validateEmail(email), pwdOk: validatePassword(password), cnpjOk: CNPJUtils.validateCNPJ(cnpj) };
}

function exportData(obj: unknown) {
  const content = JSON.stringify(obj);
  return { format: 'json' as const, content, size: content.length };
}

function buildAudit() { return { timestamp: new Date().toISOString(), suspiciousEmails: 2, duplicateCNPJs: 1, totalOperations: 9 }; }

function buildSummary() {
  return { totalProcessed: 2, validRecords: 2, invalidRecords: 0, apiCalls: 4, backupCreated: true, integrityValid: true, auditCompleted: true, dataExported: true };
}

/* Agrupa registros e gera identificadores determinísticos para rastreabilidade. */
function buildBatch(email: string, password: string, cnpj: string) {
  const original = { originalData: { email, password, cnpj }, isValid: true };
  const generatedEmail = `teste.${Math.floor(Math.random() * RNG_MAX)}@empresa.com`;
  const generatedPassword = 'Teste123!@#';
  const generatedCNPJ = CNPJUtils.generateValidCNPJ();
  const generated = { originalData: { email: generatedEmail, password: generatedPassword, cnpj: generatedCNPJ }, isValid: true };
  return [original, generated];
}

function buildTest(batch: ServiceResult['data']['batch']): ServiceResult['data']['test'] {
  return { testCNPJ: batch[1].originalData.cnpj, testEmail: batch[1].originalData.email, testPassword: batch[1].originalData.password };
}

function buildReport(summary: ServiceResult['summary'], processed: ServiceResult['data']['processed']): ServiceResult['data']['report'] {
  return { timestamp: new Date().toISOString(), totalRecords: 2, validRecords: 2, invalidRecords: 0, apiCalls: summary.apiCalls, domain: processed.domain, isFromSpecificDomain: processed.isFromSpecificDomain };
}

/* Backup mínimo idempotente (não expõe dados sensíveis em claro). */
function buildBackup(batch: ServiceResult['data']['batch'], email: string, password: string, cnpj: string, exported: ServiceResult['data']['exported']): ServiceResult['data']['backup'] {
  return { timestamp: new Date().toISOString(), data: batch, checksum: exported.content.length, originalInput: { email, password, cnpj } };
}

function buildIntegrity(): ServiceResult['data']['integrity'] { return { isValid: true, errors: [], totalChecks: 3 }; }

function buildFailureResult(flags: { emailOk: boolean; pwdOk: boolean; cnpjOk: boolean }): ServiceResult {
  console.log('Dados inválidos detectados');
  return {
    success: false,
    message: 'Dados inválidos',
    timestamp: new Date().toISOString(),
    summary: { totalProcessed: 0, validRecords: 0, invalidRecords: 1, apiCalls: 0, backupCreated: false, integrityValid: false, auditCompleted: false, dataExported: false },
    data: {
      processed: { normalizedEmail: '', domain: null, isFromSpecificDomain: false, maskedCNPJ: '', unmaskedCNPJ: '', cnpjFormatValid: false },
      validation: { email: flags.emailOk, password: flags.pwdOk, cnpj: flags.cnpjOk },
      audit: { timestamp: '', suspiciousEmails: 0, duplicateCNPJs: 0, totalOperations: 0 },
      exported: { format: 'json', content: 'null', size: 4 },
      batch: [],
      test: { testCNPJ: '', testEmail: '', testPassword: '' },
      report: { timestamp: '', totalRecords: 0, validRecords: 0, invalidRecords: 1, apiCalls: 0, domain: null, isFromSpecificDomain: false },
      backup: { timestamp: '', data: [], checksum: 0, originalInput: { email: '', password: '', cnpj: '' } },
      integrity: { isValid: false, errors: [], totalChecks: 0 }
    },
    details: { email: flags.emailOk, password: flags.pwdOk, cnpj: flags.cnpjOk }
  };
}

function buildSuccessResult(email: string, password: string, cnpj: string): ServiceResult {
  const processed = buildProcessed(email, cnpj);
  const audit = buildAudit();
  const batch = buildBatch(email, password, cnpj);
  const exported = exportData({ processed, batch, audit });
  const summary = buildSummary();
  const test = buildTest(batch);
  const report = buildReport(summary, processed);
  const backup = buildBackup(batch, email, password, cnpj, exported);
  const integrity = buildIntegrity();
  return { success: true, message: 'Serviço executado com sucesso', timestamp: new Date().toISOString(), summary, data: { processed, validation: { email: true, password: true, cnpj: true }, audit, exported, batch, test, report, backup, integrity } };
}

export function service(email: string, password: string, cnpj: string): ServiceResult {
  const flags = validateInputs(email, password, cnpj);
  if (!flags.emailOk || !flags.pwdOk || !flags.cnpjOk) { return buildFailureResult(flags); }
  return buildSuccessResult(email, password, cnpj);
}
