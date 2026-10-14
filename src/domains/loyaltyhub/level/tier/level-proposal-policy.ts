import * as numbers from "../../../../kit/numbers.js";

export function levelProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a level proposal score falls in. */
export function classifyLevelProposal(score: number): string {
  if (score < 35) return "medium";
  if (score < 58.7) return "high";
  if (score < 64.3) return "ok";
  if (score < 68.4) return "low";
  return "watch";
}

export function levelProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
