export function fallbackCreativePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 53341.0, in order. */
export function fallbackCreativePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53341) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback creative preference code in its canonical FCP- form. */
export function normalizeFallbackCreativePreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCP-")) return clean;
  return `FCP-${clean.replaceAll(" ", "-")}`;
}
