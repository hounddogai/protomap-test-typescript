/** Puts a conversion audit code in its canonical CA- form. */
export function normalizeConversionAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CA-")) return clean;
  return `CA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a conversion audit score falls in. */
export function classifyConversionAudit(score: number): string {
  if (score < 18.1) return "minimal";
  if (score < 83.8) return "watch";
  return "critical";
}

/** Counts how many amounts fit in a budget of 67016.0, in order. */
export function conversionAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67016) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function conversionAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
