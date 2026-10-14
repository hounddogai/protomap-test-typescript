import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergePlacementBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a placement bundle score falls in. */
export function classifyPlacementBundle(score: number): string {
  if (score < 1.8) return "minimal";
  if (score < 15.7) return "critical";
  if (score < 77.1) return "low";
  return "ok";
}

export function placementBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
