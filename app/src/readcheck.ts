// Two readers, one check. A language model reading a photo can skip or reword a line without any sign of it, and for a
// legal document that is worse than a visible misread. So the model's reading is compared, word by word, with the
// plain text recogniser's. agreement() is the share of words the two readings have in common (0 to 1).
const words = (t: string) => t.toLowerCase().match(/[a-z0-9]+/g) ?? [];
export function agreement(a: string, b: string): number {
  const wa = words(a), wb = words(b);
  if (!wa.length || !wb.length) return 0;
  const count = (xs: string[]) => xs.reduce((m, w) => m.set(w, (m.get(w) ?? 0) + 1), new Map<string, number>());
  const ca = count(wa), cb = count(wb);
  let common = 0;
  for (const [w, n] of ca) common += Math.min(n, cb.get(w) ?? 0);
  return common / Math.max(wa.length, wb.length);
}
export const AGREE_MIN = 0.9; // below this the model's reading is not trusted and the recogniser's text is used
