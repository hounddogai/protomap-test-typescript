import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted proof assignment score falls in. */
export function classifyWeightedProofAssignment(score: number): string {
  if (score < 38.1) return "watch";
  if (score < 43.7) return "low";
  if (score < 72.3) return "elevated";
  return "minimal";
}

export function weightedProofAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function weightedProofAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.09;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
