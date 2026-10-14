import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a exit rule profile score falls in. */
export function classifyExitRuleProfile(score: number): string {
  if (score < 12.1) return "ok";
  if (score < 76.5) return "minimal";
  if (score < 80.6) return "high";
  if (score < 87) return "critical";
  return "elevated";
}

export function exitRuleProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function mergeExitRuleProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
