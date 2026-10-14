import * as numbers from "../../../../kit/numbers.js";

/** Names the band a batched macro checkpoint score falls in. */
export function classifyBatchedMacroCheckpoint(score: number): string {
  if (score < 11.4) return "minimal";
  if (score < 20.6) return "watch";
  if (score < 24.9) return "ok";
  if (score < 46.6) return "elevated";
  return "critical";
}

export function batchedMacroCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
