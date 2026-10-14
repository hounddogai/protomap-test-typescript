/** Counts how many amounts fit in a budget of 33389.0, in order. */
export function enrollmentProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33389) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a enrollment proposal code in its canonical EP- form. */
export function normalizeEnrollmentProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EP-")) return clean;
  return `EP-${clean.replaceAll(" ", "-")}`;
}
