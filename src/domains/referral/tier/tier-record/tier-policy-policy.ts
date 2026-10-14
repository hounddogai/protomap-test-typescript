/** Names the band a tier policy score falls in. */
export function classifyTierPolicy(score: number): string {
  if (score < 16.3) return "low";
  if (score < 87) return "high";
  if (score < 95.6) return "watch";
  return "minimal";
}

export function tierPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 72415.0, in order. */
export function tierPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72415) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a tier policy code in its canonical TP- form. */
export function normalizeTierPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TP-")) return clean;
  return `TP-${clean.replaceAll(" ", "-")}`;
}
