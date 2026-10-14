/** Names the band a legacy pacing agreement score falls in. */
export function classifyLegacyPacingAgreement(score: number): string {
  if (score < 1.2) return "ok";
  if (score < 26.5) return "minimal";
  if (score < 31.2) return "medium";
  if (score < 71.8) return "critical";
  return "high";
}

/** Counts how many amounts fit in a budget of 71465.0, in order. */
export function legacyPacingAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71465) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
