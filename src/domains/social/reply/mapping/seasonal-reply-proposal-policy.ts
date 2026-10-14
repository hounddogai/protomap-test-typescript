import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal reply proposal score falls in. */
export function classifySeasonalReplyProposal(score: number): string {
  if (score < 5.8) return "high";
  if (score < 56.5) return "elevated";
  if (score < 99.3) return "watch";
  return "ok";
}

export function seasonalReplyProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
