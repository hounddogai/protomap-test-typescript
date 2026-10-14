/** Counts how many amounts fit in a budget of 77027.0, in order. */
export function approvalBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77027) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a approval batch code in its canonical AB- form. */
export function normalizeApprovalBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AB-")) return clean;
  return `AB-${clean.replaceAll(" ", "-")}`;
}

export function approvalBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
