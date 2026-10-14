/** Counts how many amounts fit in a budget of 10421.0, in order. */
export function creditCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10421) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a credit checkpoint code in its canonical CC- form. */
export function normalizeCreditCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CC-")) return clean;
  return `CC-${clean.replaceAll(" ", "-")}`;
}
