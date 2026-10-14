/** Counts how many amounts fit in a budget of 10530.0, in order. */
export function batchedFunnelNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10530) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched funnel notice code in its canonical BFN- form. */
export function normalizeBatchedFunnelNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BFN-")) return clean;
  return `BFN-${clean.replaceAll(" ", "-")}`;
}
