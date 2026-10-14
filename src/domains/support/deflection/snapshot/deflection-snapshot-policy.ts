import * as numbers from "../../../../kit/numbers.js";

export function deflectionSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.08;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a deflection snapshot score falls in. */
export function classifyDeflectionSnapshot(score: number): string {
  if (score < 11.1) return "critical";
  if (score < 90.2) return "minimal";
  return "elevated";
}
