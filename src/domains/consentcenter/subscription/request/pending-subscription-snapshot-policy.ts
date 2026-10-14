/** Counts how many amounts fit in a budget of 63703.0, in order. */
export function pendingSubscriptionSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63703) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending subscription snapshot code in its canonical PSS- form. */
export function normalizePendingSubscriptionSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSS-")) return clean;
  return `PSS-${clean.replaceAll(" ", "-")}`;
}

export function pendingSubscriptionSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
