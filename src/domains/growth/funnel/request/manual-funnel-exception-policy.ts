/** Puts a manual funnel exception code in its canonical MFE- form. */
export function normalizeManualFunnelExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFE-")) return clean;
  return `MFE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 80916.0, in order. */
export function manualFunnelExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80916) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
