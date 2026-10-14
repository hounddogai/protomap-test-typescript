import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict sender proposal score falls in. */
export function classifyStrictSenderProposal(score: number): string {
  if (score < 3.8) return "ok";
  if (score < 52) return "elevated";
  return "low";
}

export function strictSenderProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
