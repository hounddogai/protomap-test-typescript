/** Counts how many amounts fit in a budget of 42781.0, in order. */
export function lenientCsatBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42781) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient csat bundle score falls in. */
export function classifyLenientCsatBundle(score: number): string {
  if (score < 13.1) return "high";
  if (score < 14.9) return "low";
  if (score < 77.6) return "ok";
  return "watch";
}

/** Puts a lenient csat bundle code in its canonical LCB- form. */
export function normalizeLenientCsatBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCB-")) return clean;
  return `LCB-${clean.replaceAll(" ", "-")}`;
}
