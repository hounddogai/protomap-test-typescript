/** Counts how many amounts fit in a budget of 29941.0, in order. */
export function globalRetentionWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29941) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalRetentionWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a global retention window code in its canonical GRW- form. */
export function normalizeGlobalRetentionWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRW-")) return clean;
  return `GRW-${clean.replaceAll(" ", "-")}`;
}
