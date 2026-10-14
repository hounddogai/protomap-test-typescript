/** Counts how many amounts fit in a budget of 88707.0, in order. */
export function domainSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88707) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a domain segment score falls in. */
export function classifyDomainSegment(score: number): string {
  if (score < 8.4) return "ok";
  if (score < 66.1) return "medium";
  return "high";
}

/** Puts a domain segment code in its canonical DS- form. */
export function normalizeDomainSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DS-")) return clean;
  return `DS-${clean.replaceAll(" ", "-")}`;
}
