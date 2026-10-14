/** Puts a creative draft code in its canonical CD- form. */
export function normalizeCreativeDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CD-")) return clean;
  return `CD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a creative draft score falls in. */
export function classifyCreativeDraft(score: number): string {
  if (score < 38.9) return "ok";
  if (score < 69.1) return "elevated";
  if (score < 77.3) return "critical";
  return "watch";
}

export function creativeDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 49048.0, in order. */
export function creativeDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49048) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
