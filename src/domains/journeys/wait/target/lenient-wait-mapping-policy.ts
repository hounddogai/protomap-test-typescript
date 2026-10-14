/** Counts how many amounts fit in a budget of 11284.0, in order. */
export function lenientWaitMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11284) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient wait mapping code in its canonical LWM- form. */
export function normalizeLenientWaitMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWM-")) return clean;
  return `LWM-${clean.replaceAll(" ", "-")}`;
}
