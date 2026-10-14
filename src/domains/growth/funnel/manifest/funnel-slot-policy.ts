import * as numbers from "../../../../kit/numbers.js";

/** Names the band a funnel slot score falls in. */
export function classifyFunnelSlot(score: number): string {
  if (score < 25.8) return "elevated";
  if (score < 47.9) return "minimal";
  if (score < 72.5) return "critical";
  if (score < 74.8) return "medium";
  return "ok";
}

export function funnelSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function funnelSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
