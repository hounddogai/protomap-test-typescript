import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeExitRuleMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function exitRuleMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a exit rule metric score falls in. */
export function classifyExitRuleMetric(score: number): string {
  if (score < 9.8) return "ok";
  if (score < 27.1) return "watch";
  if (score < 56.8) return "high";
  if (score < 86.7) return "low";
  return "minimal";
}
