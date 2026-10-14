import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global payout draft score falls in. */
export function classifyGlobalPayoutDraft(score: number): string {
  if (score < 12.1) return "high";
  if (score < 25.8) return "watch";
  return "minimal";
}

export function globalPayoutDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
