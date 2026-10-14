import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingBadgeAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a rolling badge assignment score falls in. */
export function classifyRollingBadgeAssignment(score: number): string {
  if (score < 9.3) return "critical";
  if (score < 16.3) return "high";
  if (score < 70.9) return "medium";
  if (score < 92.7) return "elevated";
  return "watch";
}

export function rollingBadgeAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
