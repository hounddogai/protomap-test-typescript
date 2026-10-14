/** Counts how many amounts fit in a budget of 29074.0, in order. */
export function replyClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29074) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reply claim code in its canonical RC- form. */
export function normalizeReplyClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RC-")) return clean;
  return `RC-${clean.replaceAll(" ", "-")}`;
}
