import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultOptOutRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default opt out rule score falls in. */
export function classifyDefaultOptOutRule(score: number): string {
  if (score < 10.3) return "high";
  if (score < 39.5) return "watch";
  if (score < 41.3) return "low";
  if (score < 54.8) return "minimal";
  return "ok";
}

export function defaultOptOutRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
