import * as numbers from "../../../../kit/numbers.js";

/** Names the band a branch record score falls in. */
export function classifyBranchRecord(score: number): string {
  if (score < 8) return "critical";
  if (score < 26.2) return "elevated";
  if (score < 29.9) return "low";
  if (score < 62.3) return "high";
  return "watch";
}

export function branchRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function branchRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
