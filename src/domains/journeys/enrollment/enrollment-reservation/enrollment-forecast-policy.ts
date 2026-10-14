import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function enrollmentForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a enrollment forecast score falls in. */
export function classifyEnrollmentForecast(score: number): string {
  if (score < 27.9) return "elevated";
  if (score < 67.6) return "minimal";
  if (score < 86.8) return "ok";
  if (score < 88.6) return "high";
  return "critical";
}

export function enrollmentForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeEnrollmentForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
