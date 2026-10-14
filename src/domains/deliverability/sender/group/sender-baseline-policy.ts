/** Counts how many amounts fit in a budget of 30836.0, in order. */
export function senderBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30836) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a sender baseline score falls in. */
export function classifySenderBaseline(score: number): string {
  if (score < 10.1) return "watch";
  if (score < 14.4) return "high";
  if (score < 58.4) return "low";
  return "ok";
}

/** Puts a sender baseline code in its canonical SB- form. */
export function normalizeSenderBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SB-")) return clean;
  return `SB-${clean.replaceAll(" ", "-")}`;
}
