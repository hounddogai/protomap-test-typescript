import * as numbers from "../../../../kit/numbers.js";

export function scheduledWarmupRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a scheduled warmup record score falls in. */
export function classifyScheduledWarmupRecord(score: number): string {
  if (score < 1.3) return "minimal";
  if (score < 40.2) return "high";
  if (score < 55.1) return "elevated";
  return "medium";
}

export function scheduledWarmupRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function scheduledWarmupRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
