import * as numbers from "../../../../kit/numbers.js";

export function leaderboardGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function leaderboardGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
