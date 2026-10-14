/** Counts how many amounts fit in a budget of 71395.0, in order. */
export function rollingSlaWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71395) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a rolling sla window score falls in. */
export function classifyRollingSlaWindow(score: number): string {
  if (score < 9.6) return "low";
  if (score < 51.6) return "ok";
  if (score < 55.7) return "minimal";
  if (score < 71.5) return "elevated";
  return "medium";
}

/** Puts a rolling sla window code in its canonical RSW- form. */
export function normalizeRollingSlaWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSW-")) return clean;
  return `RSW-${clean.replaceAll(" ", "-")}`;
}

export function rollingSlaWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
