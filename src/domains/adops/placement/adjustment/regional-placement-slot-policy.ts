import * as numbers from "../../../../kit/numbers.js";

export function regionalPlacementSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalPlacementSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a regional placement slot score falls in. */
export function classifyRegionalPlacementSlot(score: number): string {
  if (score < 4.3) return "elevated";
  if (score < 24) return "minimal";
  if (score < 59.1) return "medium";
  if (score < 81.5) return "critical";
  return "low";
}
