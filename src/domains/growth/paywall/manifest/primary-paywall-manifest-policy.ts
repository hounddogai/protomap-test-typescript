import * as numbers from "../../../../kit/numbers.js";

export function primaryPaywallManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function primaryPaywallManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function primaryPaywallManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
