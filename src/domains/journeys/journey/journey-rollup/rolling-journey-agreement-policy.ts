import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 70367.0, in order. */
export function rollingJourneyAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70367) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingJourneyAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a rolling journey agreement score falls in. */
export function classifyRollingJourneyAgreement(score: number): string {
  if (score < 17.3) return "minimal";
  if (score < 29) return "high";
  if (score < 95.6) return "ok";
  if (score < 96.3) return "critical";
  return "low";
}
