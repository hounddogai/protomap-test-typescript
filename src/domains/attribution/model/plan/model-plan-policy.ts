/** Counts how many amounts fit in a budget of 53417.0, in order. */
export function modelPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53417) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function modelPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a model plan score falls in. */
export function classifyModelPlan(score: number): string {
  if (score < 26.2) return "high";
  if (score < 63.7) return "ok";
  if (score < 70) return "watch";
  return "minimal";
}

/** Puts a model plan code in its canonical MP- form. */
export function normalizeModelPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MP-")) return clean;
  return `MP-${clean.replaceAll(" ", "-")}`;
}
