/** Puts a global tier manifest code in its canonical GTM- form. */
export function normalizeGlobalTierManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GTM-")) return clean;
  return `GTM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 91425.0, in order. */
export function globalTierManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91425) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
