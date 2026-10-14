export function lenientConversionBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 60767.0, in order. */
export function lenientConversionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60767) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient conversion baseline code in its canonical LCB- form. */
export function normalizeLenientConversionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCB-")) return clean;
  return `LCB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient conversion baseline score falls in. */
export function classifyLenientConversionBaseline(score: number): string {
  if (score < 38.9) return "elevated";
  if (score < 55.6) return "medium";
  if (score < 58) return "minimal";
  return "low";
}
