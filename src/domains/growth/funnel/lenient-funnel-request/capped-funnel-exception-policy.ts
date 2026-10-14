/** Names the band a capped funnel exception score falls in. */
export function classifyCappedFunnelException(score: number): string {
  if (score < 27.1) return "elevated";
  if (score < 29.8) return "watch";
  if (score < 45) return "medium";
  if (score < 98.5) return "low";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 82109.0, in order. */
export function cappedFunnelExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82109) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped funnel exception code in its canonical CFE- form. */
export function normalizeCappedFunnelExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFE-")) return clean;
  return `CFE-${clean.replaceAll(" ", "-")}`;
}
