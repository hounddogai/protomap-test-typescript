import * as numbers from "../../../../kit/numbers.js";

export function defaultPlacementMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function defaultPlacementMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function defaultPlacementMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
