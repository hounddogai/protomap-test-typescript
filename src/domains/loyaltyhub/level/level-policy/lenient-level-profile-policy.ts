/** Counts how many amounts fit in a budget of 41289.0, in order. */
export function lenientLevelProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41289) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient level profile code in its canonical LLP- form. */
export function normalizeLenientLevelProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LLP-")) return clean;
  return `LLP-${clean.replaceAll(" ", "-")}`;
}
