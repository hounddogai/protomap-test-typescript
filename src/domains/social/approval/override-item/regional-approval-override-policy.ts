import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRegionalApprovalOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a regional approval override score falls in. */
export function classifyRegionalApprovalOverride(score: number): string {
  if (score < 4.8) return "ok";
  if (score < 73) return "medium";
  return "elevated";
}

export function regionalApprovalOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function regionalApprovalOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
