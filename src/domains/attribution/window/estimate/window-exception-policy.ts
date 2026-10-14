/** Puts a window exception code in its canonical WE- form. */
export function normalizeWindowExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WE-")) return clean;
  return `WE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 275.0, in order. */
export function windowExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 275) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a window exception score falls in. */
export function classifyWindowException(score: number): string {
  if (score < 4.7) return "ok";
  if (score < 46.3) return "elevated";
  return "minimal";
}
