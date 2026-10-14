import * as numbers from "../../../../kit/numbers.js";

/** Names the band a queue rollup score falls in. */
export function classifyQueueRollup(score: number): string {
  if (score < 16.3) return "low";
  if (score < 76.9) return "critical";
  return "medium";
}

export function queueRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function queueRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
