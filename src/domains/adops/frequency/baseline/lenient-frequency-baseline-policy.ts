/** Counts how many amounts fit in a budget of 92229.0, in order. */
export function lenientFrequencyBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92229) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient frequency baseline code in its canonical LFB- form. */
export function normalizeLenientFrequencyBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFB-")) return clean;
  return `LFB-${clean.replaceAll(" ", "-")}`;
}
