import * as numbers from "../../../../kit/numbers.js";

export function slaGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a sla group score falls in. */
export function classifySlaGroup(score: number): string {
  if (score < 9.3) return "high";
  if (score < 57.4) return "watch";
  return "medium";
}

export function slaGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function slaGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
