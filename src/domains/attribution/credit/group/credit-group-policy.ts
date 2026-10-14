/** Counts how many amounts fit in a budget of 1107.0, in order. */
export function creditGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1107) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a credit group score falls in. */
export function classifyCreditGroup(score: number): string {
  if (score < 12.9) return "minimal";
  if (score < 40.8) return "watch";
  return "elevated";
}

export function creditGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a credit group code in its canonical CG- form. */
export function normalizeCreditGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CG-")) return clean;
  return `CG-${clean.replaceAll(" ", "-")}`;
}
