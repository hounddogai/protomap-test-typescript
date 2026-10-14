/** Puts a queue baseline code in its canonical QB- form. */
export function normalizeQueueBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QB-")) return clean;
  return `QB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 58278.0, in order. */
export function queueBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58278) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
