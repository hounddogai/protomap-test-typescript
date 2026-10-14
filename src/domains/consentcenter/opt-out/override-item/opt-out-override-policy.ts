import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a opt out override score falls in. */
export function classifyOptOutOverride(score: number): string {
  if (score < 33.7) return "low";
  if (score < 62.6) return "elevated";
  if (score < 70.1) return "critical";
  if (score < 82.6) return "medium";
  return "ok";
}

export function optOutOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeOptOutOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
