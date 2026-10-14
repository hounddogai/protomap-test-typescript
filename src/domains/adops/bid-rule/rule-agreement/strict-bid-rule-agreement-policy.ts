import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict bid rule agreement score falls in. */
export function classifyStrictBidRuleAgreement(score: number): string {
  if (score < 12) return "medium";
  if (score < 34.8) return "high";
  if (score < 66.1) return "watch";
  return "low";
}

export function strictBidRuleAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictBidRuleAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
