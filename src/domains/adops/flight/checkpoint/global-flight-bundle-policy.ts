import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global flight bundle score falls in. */
export function classifyGlobalFlightBundle(score: number): string {
  if (score < 1.9) return "minimal";
  if (score < 36.3) return "elevated";
  if (score < 38.4) return "critical";
  return "ok";
}

export function mergeGlobalFlightBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
