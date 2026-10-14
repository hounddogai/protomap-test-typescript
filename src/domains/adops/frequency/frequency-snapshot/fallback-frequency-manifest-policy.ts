import * as numbers from "../../../../kit/numbers.js";

export function fallbackFrequencyManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function fallbackFrequencyManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function fallbackFrequencyManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
