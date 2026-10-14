/** Counts how many amounts fit in a budget of 22828.0, in order. */
export function cappedQueueNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22828) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped queue notice code in its canonical CQN- form. */
export function normalizeCappedQueueNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CQN-")) return clean;
  return `CQN-${clean.replaceAll(" ", "-")}`;
}
