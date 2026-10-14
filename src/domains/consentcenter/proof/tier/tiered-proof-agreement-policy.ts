import * as numbers from "../../../../kit/numbers.js";

export function tieredProofAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a tiered proof agreement score falls in. */
export function classifyTieredProofAgreement(score: number): string {
  if (score < 19.8) return "low";
  if (score < 36.5) return "watch";
  if (score < 39.3) return "high";
  if (score < 98.3) return "minimal";
  return "medium";
}
