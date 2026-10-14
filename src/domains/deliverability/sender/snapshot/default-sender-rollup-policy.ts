import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default sender rollup score falls in. */
export function classifyDefaultSenderRollup(score: number): string {
  if (score < 9.1) return "watch";
  if (score < 16.5) return "minimal";
  if (score < 59) return "critical";
  return "elevated";
}

export function defaultSenderRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function defaultSenderRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
