/** Counts how many amounts fit in a budget of 62930.0, in order. */
export function legacyTicketViewDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62930) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a legacy ticket view draft code in its canonical LTVD- form. */
export function normalizeLegacyTicketViewDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LTVD-")) return clean;
  return `LTVD-${clean.replaceAll(" ", "-")}`;
}
