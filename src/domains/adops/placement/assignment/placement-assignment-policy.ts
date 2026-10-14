import * as numbers from "../../../../kit/numbers.js";

/** Names the band a placement assignment score falls in. */
export function classifyPlacementAssignment(score: number): string {
  if (score < 53.4) return "minimal";
  if (score < 72.3) return "watch";
  if (score < 84.6) return "elevated";
  if (score < 86.2) return "medium";
  return "ok";
}

export function placementAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
