/** Names the band a primary post snapshot score falls in. */
export function classifyPrimaryPostSnapshot(score: number): string {
  if (score < 1.1) return "minimal";
  if (score < 20.6) return "high";
  if (score < 57.8) return "critical";
  return "low";
}

/** Puts a primary post snapshot code in its canonical PPS- form. */
export function normalizePrimaryPostSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPS-")) return clean;
  return `PPS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 37541.0, in order. */
export function primaryPostSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37541) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
