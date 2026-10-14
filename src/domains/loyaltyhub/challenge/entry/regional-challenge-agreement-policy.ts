import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 50661.0, in order. */
export function regionalChallengeAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50661) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function regionalChallengeAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a regional challenge agreement score falls in. */
export function classifyRegionalChallengeAgreement(score: number): string {
  if (score < 59.2) return "elevated";
  if (score < 75.6) return "high";
  return "low";
}

export function regionalChallengeAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
