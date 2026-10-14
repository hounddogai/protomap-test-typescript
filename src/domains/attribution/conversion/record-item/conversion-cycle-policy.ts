import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function conversionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeConversionCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a conversion cycle score falls in. */
export function classifyConversionCycle(score: number): string {
  if (score < 57.2) return "minimal";
  if (score < 66.4) return "critical";
  if (score < 68.3) return "ok";
  if (score < 98.2) return "watch";
  return "elevated";
}
