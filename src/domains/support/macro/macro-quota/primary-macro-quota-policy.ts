import * as numbers from "../../../../kit/numbers.js";

export function primaryMacroQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a primary macro quota score falls in. */
export function classifyPrimaryMacroQuota(score: number): string {
  if (score < 50.9) return "ok";
  if (score < 53.5) return "minimal";
  if (score < 87.4) return "watch";
  return "high";
}

export function primaryMacroQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
