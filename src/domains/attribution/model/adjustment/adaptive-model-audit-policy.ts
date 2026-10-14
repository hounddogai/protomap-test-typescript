/** Puts a adaptive model audit code in its canonical AMA- form. */
export function normalizeAdaptiveModelAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AMA-")) return clean;
  return `AMA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 93747.0, in order. */
export function adaptiveModelAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93747) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
