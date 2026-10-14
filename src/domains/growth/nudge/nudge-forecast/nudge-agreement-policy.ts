/** Counts how many amounts fit in a budget of 45673.0, in order. */
export function nudgeAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45673) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a nudge agreement code in its canonical NA- form. */
export function normalizeNudgeAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NA-")) return clean;
  return `NA-${clean.replaceAll(" ", "-")}`;
}
