import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a reputation plan score falls in. */
export function classifyReputationPlan(score: number): string {
  if (score < 4.9) return "critical";
  if (score < 11.6) return "low";
  if (score < 20.3) return "minimal";
  if (score < 25) return "elevated";
  return "high";
}

export function reputationPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeReputationPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
