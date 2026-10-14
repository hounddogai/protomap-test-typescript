import * as numbers from "../../../../kit/numbers.js";

export function slaQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function slaQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function slaQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a sla quota score falls in. */
export function classifySlaQuota(score: number): string {
  if (score < 40.9) return "high";
  if (score < 44.6) return "critical";
  if (score < 55.5) return "medium";
  if (score < 63.8) return "low";
  return "minimal";
}
