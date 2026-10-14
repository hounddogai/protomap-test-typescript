/** Puts a wait request code in its canonical WR- form. */
export function normalizeWaitRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WR-")) return clean;
  return `WR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 93380.0, in order. */
export function waitRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93380) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function waitRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a wait request score falls in. */
export function classifyWaitRequest(score: number): string {
  if (score < 17.5) return "ok";
  if (score < 66.8) return "elevated";
  return "high";
}
