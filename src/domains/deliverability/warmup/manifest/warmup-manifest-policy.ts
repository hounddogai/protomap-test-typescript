import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a warmup manifest score falls in. */
export function classifyWarmupManifest(score: number): string {
  if (score < 66) return "elevated";
  if (score < 98.4) return "medium";
  return "critical";
}

export function mergeWarmupManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
