import * as numbers from "../../../../kit/numbers.js";

export function strictWindowPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictWindowPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a strict window preference score falls in. */
export function classifyStrictWindowPreference(score: number): string {
  if (score < 25.6) return "minimal";
  if (score < 44.4) return "high";
  return "elevated";
}
