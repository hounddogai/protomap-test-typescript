import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback funnel threshold score falls in. */
export function classifyFallbackFunnelThreshold(score: number): string {
  if (score < 22.4) return "medium";
  if (score < 43.8) return "minimal";
  return "low";
}

export function fallbackFunnelThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function fallbackFunnelThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
