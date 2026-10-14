import * as numbers from "../../../../kit/numbers.js";

export function scheduledWarmupClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function scheduledWarmupClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a scheduled warmup claim score falls in. */
export function classifyScheduledWarmupClaim(score: number): string {
  if (score < 9.3) return "watch";
  if (score < 26.5) return "elevated";
  if (score < 86.2) return "high";
  return "low";
}

export function scheduledWarmupClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
