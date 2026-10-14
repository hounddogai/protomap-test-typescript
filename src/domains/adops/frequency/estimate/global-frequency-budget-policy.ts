import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function globalFrequencyBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function mergeGlobalFrequencyBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a global frequency budget score falls in. */
export function classifyGlobalFrequencyBudget(score: number): string {
  if (score < 8.1) return "watch";
  if (score < 47.3) return "low";
  if (score < 47.8) return "critical";
  if (score < 99.5) return "minimal";
  return "ok";
}

export function globalFrequencyBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
