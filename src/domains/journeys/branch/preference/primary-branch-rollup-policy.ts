import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryBranchRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function primaryBranchRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a primary branch rollup score falls in. */
export function classifyPrimaryBranchRollup(score: number): string {
  if (score < 64.3) return "ok";
  if (score < 82.5) return "medium";
  if (score < 85.2) return "low";
  if (score < 96.7) return "critical";
  return "watch";
}

export function primaryBranchRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
