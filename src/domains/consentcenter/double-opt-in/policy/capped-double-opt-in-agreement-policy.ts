/** Puts a capped double opt in agreement code in its canonical CDOIA- form. */
export function normalizeCappedDoubleOptInAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CDOIA-")) return clean;
  return `CDOIA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 56820.0, in order. */
export function cappedDoubleOptInAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56820) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
