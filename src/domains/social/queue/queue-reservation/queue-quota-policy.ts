import * as numbers from "../../../../kit/numbers.js";

export function queueQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.08;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a queue quota score falls in. */
export function classifyQueueQuota(score: number): string {
  if (score < 10.9) return "medium";
  if (score < 69.5) return "elevated";
  if (score < 77.7) return "ok";
  if (score < 91.4) return "low";
  return "watch";
}

export function queueQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function queueQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
