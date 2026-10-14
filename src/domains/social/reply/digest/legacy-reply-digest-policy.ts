export function legacyReplyDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 97111.0, in order. */
export function legacyReplyDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97111) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a legacy reply digest code in its canonical LRD- form. */
export function normalizeLegacyReplyDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRD-")) return clean;
  return `LRD-${clean.replaceAll(" ", "-")}`;
}
