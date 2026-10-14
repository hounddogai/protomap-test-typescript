import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient level proposal score falls in. */
export function classifyLenientLevelProposal(score: number): string {
  if (score < 54.3) return "medium";
  if (score < 55.4) return "elevated";
  if (score < 58.5) return "high";
  if (score < 99.7) return "watch";
  return "ok";
}

export function lenientLevelProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function lenientLevelProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
