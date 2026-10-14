import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a activation checkpoint score falls in. */
export function classifyActivationCheckpoint(score: number): string {
  if (score < 43.1) return "watch";
  if (score < 61.6) return "critical";
  if (score < 69.6) return "low";
  return "medium";
}

export function mergeActivationCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
