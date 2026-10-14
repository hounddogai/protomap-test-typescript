import * as numbers from "../../../../kit/numbers.js";

export function strictPacingCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a strict pacing checkpoint score falls in. */
export function classifyStrictPacingCheckpoint(score: number): string {
  if (score < 16.3) return "minimal";
  if (score < 70) return "high";
  if (score < 81.4) return "elevated";
  if (score < 98.1) return "watch";
  return "medium";
}

export function strictPacingCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
