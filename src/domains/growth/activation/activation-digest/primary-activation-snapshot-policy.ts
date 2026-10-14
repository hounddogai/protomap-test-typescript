/** Names the band a primary activation snapshot score falls in. */
export function classifyPrimaryActivationSnapshot(score: number): string {
  if (score < 58.1) return "elevated";
  if (score < 89.4) return "high";
  return "ok";
}

/** Puts a primary activation snapshot code in its canonical PAS- form. */
export function normalizePrimaryActivationSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PAS-")) return clean;
  return `PAS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 87474.0, in order. */
export function primaryActivationSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87474) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
