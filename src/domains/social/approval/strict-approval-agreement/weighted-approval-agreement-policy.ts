import * as numbers from "../../../../kit/numbers.js";

export function weightedApprovalAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a weighted approval agreement score falls in. */
export function classifyWeightedApprovalAgreement(score: number): string {
  if (score < 37.5) return "ok";
  if (score < 55.6) return "low";
  if (score < 82.6) return "high";
  return "elevated";
}
