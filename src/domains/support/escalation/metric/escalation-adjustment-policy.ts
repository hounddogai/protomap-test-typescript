import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeEscalationAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a escalation adjustment score falls in. */
export function classifyEscalationAdjustment(score: number): string {
  if (score < 8) return "minimal";
  if (score < 14.7) return "medium";
  if (score < 69.8) return "high";
  if (score < 85.2) return "critical";
  return "low";
}

export function escalationAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
