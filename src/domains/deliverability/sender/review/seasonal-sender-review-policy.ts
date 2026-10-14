/** Counts how many amounts fit in a budget of 7394.0, in order. */
export function seasonalSenderReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7394) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal sender review code in its canonical SSR- form. */
export function normalizeSeasonalSenderReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSR-")) return clean;
  return `SSR-${clean.replaceAll(" ", "-")}`;
}
