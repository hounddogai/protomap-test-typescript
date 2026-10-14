/** Names the band a enrollment baseline score falls in. */
export function classifyEnrollmentBaseline(score: number): string {
  if (score < 13.1) return "medium";
  if (score < 19.7) return "ok";
  if (score < 72) return "critical";
  if (score < 86.6) return "high";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 24497.0, in order. */
export function enrollmentBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24497) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a enrollment baseline code in its canonical EB- form. */
export function normalizeEnrollmentBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EB-")) return clean;
  return `EB-${clean.replaceAll(" ", "-")}`;
}
