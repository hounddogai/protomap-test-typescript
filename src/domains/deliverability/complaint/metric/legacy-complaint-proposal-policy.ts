import * as numbers from "../../../../kit/numbers.js";

export function legacyComplaintProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy complaint proposal score falls in. */
export function classifyLegacyComplaintProposal(score: number): string {
  if (score < 39.9) return "watch";
  if (score < 62.1) return "low";
  if (score < 98) return "medium";
  if (score < 99.1) return "minimal";
  return "high";
}
