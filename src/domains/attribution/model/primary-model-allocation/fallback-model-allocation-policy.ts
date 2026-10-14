import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback model allocation score falls in. */
export function classifyFallbackModelAllocation(score: number): string {
  if (score < 26.3) return "elevated";
  if (score < 62.5) return "high";
  if (score < 63.4) return "minimal";
  return "medium";
}

export function fallbackModelAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackModelAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function fallbackModelAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
