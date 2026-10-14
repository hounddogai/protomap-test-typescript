/** Puts a bounce review code in its canonical BR- form. */
export function normalizeBounceReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BR-")) return clean;
  return `BR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 52661.0, in order. */
export function bounceReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52661) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
