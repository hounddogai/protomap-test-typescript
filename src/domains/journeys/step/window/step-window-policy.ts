import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStepWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a step window score falls in. */
export function classifyStepWindow(score: number): string {
  if (score < 4.8) return "ok";
  if (score < 74.7) return "minimal";
  if (score < 76.1) return "critical";
  return "high";
}
