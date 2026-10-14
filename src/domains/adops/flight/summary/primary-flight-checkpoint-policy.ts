import * as numbers from "../../../../kit/numbers.js";

export function primaryFlightCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a primary flight checkpoint score falls in. */
export function classifyPrimaryFlightCheckpoint(score: number): string {
  if (score < 18.9) return "ok";
  if (score < 25.8) return "watch";
  if (score < 87.3) return "low";
  return "minimal";
}
