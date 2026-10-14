import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual invite checkpoint score falls in. */
export function classifyManualInviteCheckpoint(score: number): string {
  if (score < 63.4) return "watch";
  if (score < 65.6) return "medium";
  return "low";
}

export function manualInviteCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
