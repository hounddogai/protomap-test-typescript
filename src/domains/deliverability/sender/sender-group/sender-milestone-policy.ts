export function senderMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a sender milestone code in its canonical SM- form. */
export function normalizeSenderMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SM-")) return clean;
  return `SM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 11486.0, in order. */
export function senderMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11486) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
