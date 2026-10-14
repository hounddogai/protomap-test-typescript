import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeGlobalBadgeBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a global badge baseline score falls in. */
export function classifyGlobalBadgeBaseline(score: number): string {
  if (score < 1.7) return "watch";
  if (score < 27.5) return "critical";
  if (score < 36.5) return "low";
  if (score < 48.5) return "elevated";
  return "medium";
}

export function globalBadgeBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
