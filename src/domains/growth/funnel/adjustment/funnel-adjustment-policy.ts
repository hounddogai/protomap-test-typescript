import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function funnelAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function funnelAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function mergeFunnelAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a funnel adjustment score falls in. */
export function classifyFunnelAdjustment(score: number): string {
  if (score < 31.4) return "critical";
  if (score < 57.3) return "medium";
  if (score < 70.9) return "elevated";
  if (score < 82.5) return "high";
  return "watch";
}
