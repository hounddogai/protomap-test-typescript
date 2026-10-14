import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function regionalCreativeRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function regionalCreativeRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional creative record score falls in. */
export function classifyRegionalCreativeRecord(score: number): string {
  if (score < 13.6) return "critical";
  if (score < 30.9) return "ok";
  if (score < 48.6) return "high";
  return "watch";
}

export function mergeRegionalCreativeRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
