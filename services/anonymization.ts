/**
 * PII Detection and Anonymization Service
 * Detects and masks personally identifiable information
 * (Ported from backend — pure regex logic, no Node.js APIs)
 */

export interface AnonymizationResult {
  anonymized: string;
  mappings: Record<string, string>;
}

const PII_PATTERNS = {
  phone: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Way|Park|Parkway|Pkwy|Place|Pl|Square|Sq|Trail|Trl|Park)\b/gi,
  bankAccount: /\b\d{9,17}\b(?=.*account|.*account)/gi,
  healthInsuranceId: /\b[A-Z]{2}\d{10}\b/g,
  dateOfBirth: /\b(?:0[1-9]|1[0-2])[-\/](?:0[1-9]|[12]\d|3[01])[-\/](?:19|20)\d{2}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
};

interface PiiMatch {
  type: string;
  value: string;
  placeholder: string;
}

export async function anonymizeTranscription(text: string): Promise<AnonymizationResult> {
  const mappings: Record<string, string> = {};
  let anonymized = text;

  const counters: Record<string, number> = {
    phone: 1, email: 1, creditCard: 1, ssn: 1, passport: 1,
    address: 1, bankAccount: 1, healthInsuranceId: 1, dateOfBirth: 1,
    ipAddress: 1, person: 1,
  };

  const matches: PiiMatch[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        type,
        value: match[0],
        placeholder: `<${type} ${counters[type]}>`,
      });
      counters[type]++;
    }
  }

  // Detect person names (capitalized sequences)
  const personPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  let match;
  while ((match = personPattern.exec(text)) !== null) {
    const value = match[0];
    if (!matches.some((m) => m.value === value) && isLikelyPersonName(value)) {
      matches.push({
        type: 'person',
        value,
        placeholder: `<person ${counters.person}>`,
      });
      counters.person++;
    }
  }

  const sortedMatches = matches.sort((a, b) => {
    const posA = text.indexOf(a.value);
    const posB = text.indexOf(b.value);
    return posB - posA;
  });

  const seen = new Set<string>();
  const uniqueMatches = sortedMatches.filter((match) => {
    if (seen.has(match.value.toLowerCase())) return false;
    seen.add(match.value.toLowerCase());
    return true;
  });

  for (const match of uniqueMatches) {
    const regex = new RegExp(`\\b${escapeRegex(match.value)}\\b`, 'gi');
    anonymized = anonymized.replace(regex, match.placeholder);
    mappings[match.placeholder] = match.value;
  }

  return { anonymized, mappings };
}

function isLikelyPersonName(text: string): boolean {
  const commonWords = [
    'The', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For', 'Of', 'With',
    'By', 'From', 'Is', 'Are', 'Was', 'Were', 'Been', 'Be', 'Have', 'Has',
    'Had', 'Do', 'Does', 'Did', 'Will', 'Would', 'Should', 'Could', 'May',
    'Might', 'Must', 'Can',
  ];
  if (commonWords.includes(text)) return false;
  const words = text.split(/\s+/);
  if (words.length === 1) return false;
  return words.every((word) => /^[A-Z]/.test(word) && word.length > 1);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function reversePIIMappings(text: string, mappings: Record<string, string>): string {
  let result = text;
  for (const [placeholder, original] of Object.entries(mappings)) {
    const regex = new RegExp(escapeRegex(placeholder), 'g');
    result = result.replace(regex, original);
  }
  return result;
}

export async function getPIIStats(text: string): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) stats[type] = matches.length;
  }
  return stats;
}
