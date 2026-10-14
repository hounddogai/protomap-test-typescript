/** Names the band a batched invite notice score falls in. */
export function classifyBatchedInviteNotice(score: number): string {
  if (score < 10.2) return "elevated";
  if (score < 13.5) return "critical";
  return "high";
}

/** Puts a batched invite notice code in its canonical BIN- form. */
export function normalizeBatchedInviteNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BIN-")) return clean;
  return `BIN-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 100000.0, in order. */
export function batchedInviteNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 100000) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedInviteNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
