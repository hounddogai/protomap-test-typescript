import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a regional tier manifest score falls in. */
export function classifyRegionalTierManifest(score: number): string {
  if (score < 33.5) return "medium";
  if (score < 38) return "critical";
  if (score < 52.1) return "high";
  if (score < 57.5) return "ok";
  return "low";
}

export function mergeRegionalTierManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalTierManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
