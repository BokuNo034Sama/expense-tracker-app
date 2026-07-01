// src/utils/parser.ts

export interface ParsedBankAlert {
  amount: string;
  vendor: string;
  date: string;
}

/**
 * Parses Nigerian bank SMS alert strings to extract transaction data.
 * Pure function — no side effects, no state dependencies.
 */
export function parseBankAlertString(text: string): ParsedBankAlert {
  let parsedAmount = '';
  let parsedVendor = '';
  let parsedDate   = '';

  const amountRegexes = [
    /(?:amt|amount|debit|credit|spent|paid|value)[:\s]*(?:ngn|ng|₦|\$)?\s*([\d,]+\.\d{2})/i,
    /(?:ngn|ng|₦|\$)\s*([\d,]+\.\d{2})/i,
    /(?:amt|amount|debit|credit|spent|paid|value)[:\s]*(?:ngn|ng|₦|\$)?\s*([\d,]+)/i,
    /([\d,]+\.\d{2})/,
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match?.[1]) {
      const cleaned = match[1].replace(/,/g, '');
      if (!isNaN(parseFloat(cleaned))) {
        parsedAmount = cleaned;
        break;
      }
    }
  }

  const vendorRegexes = [
    /(?:at|to|ref|merchant|desc|description|payee)[:\s]+([A-Za-z0-9\s._-]{3,20})/i,
    /paid\s+(?:to|at)\s+([A-Za-z0-9\s._-]{3,20})/i,
    /purchase\s+(?:at|on)\s+([A-Za-z0-9\s._-]{3,20})/i,
  ];

  for (const regex of vendorRegexes) {
    const match = text.match(regex);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 2) {
        parsedVendor = candidate;
        break;
      }
    }
  }

  const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}(?:\s+[\d:]+(?:\s*[APap][Mm])?)?)/);
  if (dateMatch?.[1]) {
    parsedDate = dateMatch[1].split(' ')[0].trim();
  }

  return { amount: parsedAmount, vendor: parsedVendor, date: parsedDate };
}

/**
 * Maps a vendor/category suggestion string to the closest matching
 * category ID in the user's active category list.
 */
export function mapCategoryToWorkspace(
  suggestion: string,
  categories: Array<{ id: string; name: string; is_basic: boolean }>
): string {
  const clean = (suggestion || '').toLowerCase();

  if (clean.includes('util') || clean.includes('power') || clean.includes('bill')) {
    const match = categories.find(c => {
      const name = c.name.toLowerCase();
      return name.includes('util') || name.includes('power') || name.includes('bill') || name.includes('elect');
    });
    if (match) return match.id;
  }

  if (clean.includes('food') || clean.includes('shop') || clean.includes('feed')) {
    const match = categories.find(c => {
      const name = c.name.toLowerCase();
      return name.includes('feed') || name.includes('food') || name.includes('grocer') || name.includes('shop');
    });
    if (match) return match.id;
  }

  if (clean.includes('transport') || clean.includes('fuel') || clean.includes('uber') || clean.includes('bolt')) {
    const match = categories.find(c => c.name.toLowerCase().includes('transport'));
    if (match) return match.id;
  }

  const basicFallback = categories.find(c => c.is_basic) || categories[0];
  return basicFallback?.id || '';
}
