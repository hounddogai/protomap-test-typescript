import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function regionalInsightScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeRegionalInsightScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a regional insight score score falls in. */
export function classifyRegionalInsightScore(score: number): string {
  if (score < 9) return "high";
  if (score < 29.7) return "low";
  if (score < 58.7) return "watch";
  if (score < 72.2) return "medium";
  return "ok";
}
