/** Puts a pending bounce record code in its canonical PBR- form. */
export function normalizePendingBounceRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBR-")) return clean;
  return `PBR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 15187.0, in order. */
export function pendingBounceRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15187) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending bounce record score falls in. */
export function classifyPendingBounceRecord(score: number): string {
  if (score < 22.3) return "medium";
  if (score < 47.7) return "critical";
  if (score < 53.9) return "low";
  if (score < 85.4) return "high";
  return "watch";
}

export function pendingBounceRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
