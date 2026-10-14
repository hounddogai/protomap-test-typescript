/** Puts a lenient sla review code in its canonical LSR- form. */
export function normalizeLenientSlaReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSR-")) return clean;
  return `LSR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 11308.0, in order. */
export function lenientSlaReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11308) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient sla review score falls in. */
export function classifyLenientSlaReview(score: number): string {
  if (score < 1.5) return "minimal";
  if (score < 24) return "watch";
  if (score < 54.6) return "critical";
  if (score < 93.5) return "medium";
  return "elevated";
}
