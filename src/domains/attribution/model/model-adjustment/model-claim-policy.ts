/** Puts a model claim code in its canonical MC- form. */
export function normalizeModelClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MC-")) return clean;
  return `MC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 80191.0, in order. */
export function modelClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80191) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
