import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback wait summary score falls in. */
export function classifyFallbackWaitSummary(score: number): string {
  if (score < 19.8) return "elevated";
  if (score < 63.8) return "minimal";
  return "watch";
}

export function fallbackWaitSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackWaitSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
