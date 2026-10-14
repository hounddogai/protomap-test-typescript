import * as numbers from "../../../../kit/numbers.js";

/** Names the band a proof assignment score falls in. */
export function classifyProofAssignment(score: number): string {
  if (score < 34.6) return "elevated";
  if (score < 44.4) return "watch";
  if (score < 53.9) return "minimal";
  if (score < 69.4) return "high";
  return "low";
}

export function proofAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function proofAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
