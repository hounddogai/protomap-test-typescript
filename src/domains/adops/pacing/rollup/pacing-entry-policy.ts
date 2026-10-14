import * as numbers from "../../../../kit/numbers.js";

export function pacingEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a pacing entry score falls in. */
export function classifyPacingEntry(score: number): string {
  if (score < 71.4) return "critical";
  if (score < 95.3) return "watch";
  return "minimal";
}

export function pacingEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
