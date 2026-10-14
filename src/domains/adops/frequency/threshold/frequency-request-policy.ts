import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function frequencyRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a frequency request score falls in. */
export function classifyFrequencyRequest(score: number): string {
  if (score < 35.5) return "watch";
  if (score < 56.4) return "high";
  if (score < 69.3) return "minimal";
  if (score < 89.2) return "medium";
  return "ok";
}

export function mergeFrequencyRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
