import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeCsatRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a csat record score falls in. */
export function classifyCsatRecord(score: number): string {
  if (score < 55.8) return "critical";
  if (score < 63.9) return "low";
  if (score < 77.8) return "watch";
  if (score < 88.7) return "high";
  return "minimal";
}

export function csatRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
