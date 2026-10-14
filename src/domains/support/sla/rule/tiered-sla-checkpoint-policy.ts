import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tiered sla checkpoint score falls in. */
export function classifyTieredSlaCheckpoint(score: number): string {
  if (score < 76) return "ok";
  if (score < 76.2) return "critical";
  if (score < 97.5) return "watch";
  return "minimal";
}

export function mergeTieredSlaCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
