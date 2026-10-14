import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeInsightRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a insight record score falls in. */
export function classifyInsightRecord(score: number): string {
  if (score < 10.7) return "medium";
  if (score < 43.6) return "low";
  if (score < 45.2) return "minimal";
  if (score < 62.1) return "watch";
  return "elevated";
}

export function insightRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function insightRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
