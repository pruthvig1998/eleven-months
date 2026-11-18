// Is this text something the scanner can judge? Runs before the scan. The rules are English patterns for
// residential rental agreements, so other languages are declined and other document types get a warning.
// shortcut: keyword and script counts, not a language model; upgrade if mixed-language leases are supported later.
export interface DocCheck { block: string | null; warnings: string[] }

const HINGLISH = /\b(kiraya|kirayedar|kiraye|makan ?malik|malik|mahine|mahina|nahi|nahin|hoga|hogi|honge|rupaye|rupay|wapas|dena|lena|karna|karega|karenge|ghar|aur|agar|tak|baad|pehle|jama|addu|adde|illu|nela|nelaku|ivvali|cheyali|ledu)\b/gi;

export function docCheck(text: string): DocCheck {
  const warnings: string[] = [];
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (letters.length < 40) return { block: 'There is too little text to scan. Paste the full agreement.', warnings };
  const nonLatin = letters.replace(/\p{Script=Latin}/gu, '').length / letters.length;
  if (nonLatin > 0.3) return { block: 'This agreement is not in English. The checks only work on English text for now, so a scan would miss most problems. Ask for an English copy, or have it read by someone who knows the language.', warnings };
  const words = text.split(/\s+/).length, hin = (text.match(HINGLISH) ?? []).length;
  if (hin >= 3 && hin / words > 0.08) return { block: 'This looks like Hindi or Telugu written in English letters. The checks only work on English text for now, so a scan would miss most problems.', warnings };
  if (nonLatin > 0.05 || hin >= 3) warnings.push('Parts of this text are not in English. Those parts were not checked.');
  if (!/\b(rent|lease|tenan\w+|lessee|lessor|licen[cs]\w+|landlord)\b/i.test(text))
    return { block: 'This does not look like a rental agreement: it never mentions rent, a lease, a tenant or a landlord. This tool only checks rental agreements.', warnings };
  if (/leave (and|&) licen[cs]e|\blicen[cs]or\b|\blicen[cs]ee\b/i.test(text)) warnings.push('This is a leave and licence agreement. Most checks still apply, but a licensee has weaker protection than a tenant, and the local law notes here are about leases.');
  if (/paying guest|\bP\.?G\.? (accommodation|rules|agreement)|hostel|co-?living/i.test(text)) warnings.push('This looks like paying-guest, hostel or co-living terms. They are usually a licence, not a lease, so some checks and law notes here will not fit.');
  if (/commercial (use|purpose|premises|lease)|\b(shop|office|godown|warehouse|showroom)\b/i.test(text) && !/residential/i.test(text)) warnings.push('This looks like a commercial lease. The benchmarks here (deposit, notice) are for homes and may not fit.');
  return { block: null, warnings };
}
