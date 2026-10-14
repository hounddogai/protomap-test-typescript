import * as numbers from "../../../../kit/numbers.js";

export function cappedFunnelGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a capped funnel group score falls in. */
export function classifyCappedFunnelGroup(score: number): string {
  if (score < 41.2) return "high";
  if (score < 49.1) return "critical";
  if (score < 85.1) return "medium";
  if (score < 91.2) return "minimal";
  return "ok";
}

export function cappedFunnelGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function cappedFunnelGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
