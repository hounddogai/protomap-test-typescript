/** Counts how many amounts fit in a budget of 81391.0, in order. */
export function streakRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81391) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a streak request code in its canonical SR- form. */
export function normalizeStreakRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}
