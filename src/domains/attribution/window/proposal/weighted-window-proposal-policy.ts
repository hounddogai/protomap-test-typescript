import * as numbers from "../../../../kit/numbers.js";

export function weightedWindowProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a weighted window proposal score falls in. */
export function classifyWeightedWindowProposal(score: number): string {
  if (score < 2.6) return "ok";
  if (score < 76.2) return "medium";
  if (score < 88.6) return "elevated";
  return "watch";
}

export function weightedWindowProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
