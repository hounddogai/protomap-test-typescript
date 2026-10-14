import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function globalDeflectionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function mergeGlobalDeflectionCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a global deflection cycle score falls in. */
export function classifyGlobalDeflectionCycle(score: number): string {
  if (score < 21.7) return "watch";
  if (score < 74.5) return "minimal";
  return "ok";
}
