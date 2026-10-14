/** Counts how many amounts fit in a budget of 92825.0, in order. */
export function windowBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92825) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function windowBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a window batch code in its canonical WB- form. */
export function normalizeWindowBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WB-")) return clean;
  return `WB-${clean.replaceAll(" ", "-")}`;
}
