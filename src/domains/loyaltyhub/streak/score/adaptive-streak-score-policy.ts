import * as numbers from "../../../../kit/numbers.js";

export function adaptiveStreakScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveStreakScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
