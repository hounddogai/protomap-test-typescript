import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function fraudCheckRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a fraud check rollup score falls in. */
export function classifyFraudCheckRollup(score: number): string {
  if (score < 14.1) return "medium";
  if (score < 47.4) return "low";
  if (score < 69.9) return "elevated";
  return "critical";
}

export function mergeFraudCheckRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
