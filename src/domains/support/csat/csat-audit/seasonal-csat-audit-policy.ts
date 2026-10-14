import * as numbers from "../../../../kit/numbers.js";

export function seasonalCsatAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a seasonal csat audit score falls in. */
export function classifySeasonalCsatAudit(score: number): string {
  if (score < 24.4) return "high";
  if (score < 56.3) return "elevated";
  if (score < 84.7) return "ok";
  return "minimal";
}

export function seasonalCsatAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
