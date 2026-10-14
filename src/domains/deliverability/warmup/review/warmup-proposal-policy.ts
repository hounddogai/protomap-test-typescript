import * as numbers from "../../../../kit/numbers.js";

/** Names the band a warmup proposal score falls in. */
export function classifyWarmupProposal(score: number): string {
  if (score < 50.3) return "elevated";
  if (score < 78.7) return "watch";
  if (score < 98.7) return "critical";
  return "high";
}

export function warmupProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
