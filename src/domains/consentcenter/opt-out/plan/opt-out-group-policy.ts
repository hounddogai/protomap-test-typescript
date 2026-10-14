import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeOptOutGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a opt out group score falls in. */
export function classifyOptOutGroup(score: number): string {
  if (score < 33.4) return "minimal";
  if (score < 58) return "critical";
  return "elevated";
}
