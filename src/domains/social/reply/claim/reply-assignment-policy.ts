import * as numbers from "../../../../kit/numbers.js";

export function replyAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function replyAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a reply assignment score falls in. */
export function classifyReplyAssignment(score: number): string {
  if (score < 28) return "minimal";
  if (score < 39.7) return "ok";
  if (score < 67) return "medium";
  if (score < 98.1) return "high";
  return "critical";
}
