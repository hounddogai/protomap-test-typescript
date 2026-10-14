export function reputationGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 7659.0, in order. */
export function reputationGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7659) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reputation group code in its canonical RG- form. */
export function normalizeReputationGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RG-")) return clean;
  return `RG-${clean.replaceAll(" ", "-")}`;
}
