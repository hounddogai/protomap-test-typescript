import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultProofWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default proof window score falls in. */
export function classifyDefaultProofWindow(score: number): string {
  if (score < 43.4) return "low";
  if (score < 48.5) return "minimal";
  return "elevated";
}
