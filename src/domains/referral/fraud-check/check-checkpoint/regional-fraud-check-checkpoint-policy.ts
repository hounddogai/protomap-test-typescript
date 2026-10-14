import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional fraud check checkpoint score falls in. */
export function classifyRegionalFraudCheckCheckpoint(score: number): string {
  if (score < 34.2) return "ok";
  if (score < 66) return "elevated";
  return "watch";
}

export function regionalFraudCheckCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalFraudCheckCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
