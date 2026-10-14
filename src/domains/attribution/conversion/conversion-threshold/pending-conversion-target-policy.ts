export function pendingConversionTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 26547.0, in order. */
export function pendingConversionTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26547) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending conversion target score falls in. */
export function classifyPendingConversionTarget(score: number): string {
  if (score < 42.5) return "ok";
  if (score < 66.2) return "low";
  return "minimal";
}

/** Puts a pending conversion target code in its canonical PCT- form. */
export function normalizePendingConversionTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCT-")) return clean;
  return `PCT-${clean.replaceAll(" ", "-")}`;
}
