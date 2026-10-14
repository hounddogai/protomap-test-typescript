import * as numbers from "../../../../kit/numbers.js";

export function bounceSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a bounce slot score falls in. */
export function classifyBounceSlot(score: number): string {
  if (score < 21.1) return "high";
  if (score < 28.3) return "low";
  if (score < 39.1) return "ok";
  if (score < 40) return "medium";
  return "watch";
}

export function bounceSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
