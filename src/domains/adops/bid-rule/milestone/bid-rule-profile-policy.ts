import * as numbers from "../../../../kit/numbers.js";

export function bidRuleProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a bid rule profile score falls in. */
export function classifyBidRuleProfile(score: number): string {
  if (score < 11.5) return "critical";
  if (score < 13) return "elevated";
  if (score < 29) return "low";
  if (score < 33.6) return "watch";
  return "medium";
}

export function bidRuleProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
