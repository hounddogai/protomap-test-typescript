/** Puts a primary creative digest code in its canonical PCD- form. */
export function normalizePrimaryCreativeDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCD-")) return clean;
  return `PCD-${clean.replaceAll(" ", "-")}`;
}

export function primaryCreativeDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 68769.0, in order. */
export function primaryCreativeDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68769) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
