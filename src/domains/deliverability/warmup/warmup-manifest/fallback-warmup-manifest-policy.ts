/** Counts how many amounts fit in a budget of 34152.0, in order. */
export function fallbackWarmupManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34152) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback warmup manifest code in its canonical FWM- form. */
export function normalizeFallbackWarmupManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FWM-")) return clean;
  return `FWM-${clean.replaceAll(" ", "-")}`;
}

export function fallbackWarmupManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
