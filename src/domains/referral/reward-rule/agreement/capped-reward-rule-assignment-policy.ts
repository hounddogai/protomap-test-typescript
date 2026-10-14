import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped reward rule assignment score falls in. */
export function classifyCappedRewardRuleAssignment(score: number): string {
  if (score < 18.4) return "medium";
  if (score < 30.8) return "high";
  return "minimal";
}

export function mergeCappedRewardRuleAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function cappedRewardRuleAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cappedRewardRuleAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
