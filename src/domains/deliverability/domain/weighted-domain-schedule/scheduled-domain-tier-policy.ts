import * as numbers from "../../../../kit/numbers.js";

export function scheduledDomainTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function scheduledDomainTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
