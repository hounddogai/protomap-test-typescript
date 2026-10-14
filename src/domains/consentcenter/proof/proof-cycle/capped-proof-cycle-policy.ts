/** Names the band a capped proof cycle score falls in. */
export function classifyCappedProofCycle(score: number): string {
  if (score < 20.2) return "critical";
  if (score < 52.9) return "medium";
  if (score < 55.7) return "elevated";
  if (score < 91.5) return "ok";
  return "watch";
}

/** Counts how many amounts fit in a budget of 60565.0, in order. */
export function cappedProofCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60565) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped proof cycle code in its canonical CPC- form. */
export function normalizeCappedProofCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPC-")) return clean;
  return `CPC-${clean.replaceAll(" ", "-")}`;
}
