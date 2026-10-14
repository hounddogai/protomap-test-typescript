import * as numbers from "../../../../kit/numbers.js";

export function adaptiveFraudCheckScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 94352.0, in order. */
export function adaptiveFraudCheckScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94352) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a adaptive fraud check score score falls in. */
export function classifyAdaptiveFraudCheckScore(score: number): string {
  if (score < 7) return "ok";
  if (score < 8.3) return "watch";
  if (score < 76.4) return "low";
  if (score < 84.9) return "elevated";
  return "critical";
}
