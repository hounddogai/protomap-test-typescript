/** Puts a escalation slot code in its canonical ES- form. */
export function normalizeEscalationSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ES-")) return clean;
  return `ES-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 1006.0, in order. */
export function escalationSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1006) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function escalationSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
