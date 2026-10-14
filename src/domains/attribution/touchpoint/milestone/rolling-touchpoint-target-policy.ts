/** Puts a rolling touchpoint target code in its canonical RTT- form. */
export function normalizeRollingTouchpointTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RTT-")) return clean;
  return `RTT-${clean.replaceAll(" ", "-")}`;
}

export function rollingTouchpointTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 42655.0, in order. */
export function rollingTouchpointTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42655) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
