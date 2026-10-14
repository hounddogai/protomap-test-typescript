import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary journey proposal score falls in. */
export function classifyPrimaryJourneyProposal(score: number): string {
  if (score < 71.9) return "minimal";
  if (score < 85) return "elevated";
  return "medium";
}

export function primaryJourneyProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
