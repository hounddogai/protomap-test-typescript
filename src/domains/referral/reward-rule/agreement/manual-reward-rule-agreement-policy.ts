import * as numbers from "../../../../kit/numbers.js";

export function manualRewardRuleAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a manual reward rule agreement score falls in. */
export function classifyManualRewardRuleAgreement(score: number): string {
  if (score < 56.8) return "watch";
  if (score < 56.9) return "elevated";
  if (score < 85.7) return "minimal";
  return "ok";
}
