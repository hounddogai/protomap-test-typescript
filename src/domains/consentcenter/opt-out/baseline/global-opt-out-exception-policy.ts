export function globalOptOutExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 50963.0, in order. */
export function globalOptOutExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50963) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global opt out exception code in its canonical GOOE- form. */
export function normalizeGlobalOptOutExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GOOE-")) return clean;
  return `GOOE-${clean.replaceAll(" ", "-")}`;
}
