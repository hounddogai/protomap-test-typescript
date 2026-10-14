import * as numbers from "../../../../kit/numbers.js";

export function placementSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a placement slot score falls in. */
export function classifyPlacementSlot(score: number): string {
  if (score < 22.5) return "ok";
  if (score < 29) return "medium";
  if (score < 45.7) return "high";
  return "minimal";
}

export function placementSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
