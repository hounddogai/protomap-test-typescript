import * as numbers from "../../../../kit/numbers.js";

export function tieredPacingAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered pacing audit score falls in. */
export function classifyTieredPacingAudit(score: number): string {
  if (score < 47.6) return "elevated";
  if (score < 93.4) return "high";
  return "minimal";
}

export function tieredPacingAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
