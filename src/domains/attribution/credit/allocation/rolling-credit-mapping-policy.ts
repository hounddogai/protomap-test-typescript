/** Puts a rolling credit mapping code in its canonical RCM- form. */
export function normalizeRollingCreditMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCM-")) return clean;
  return `RCM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 41614.0, in order. */
export function rollingCreditMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41614) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingCreditMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
