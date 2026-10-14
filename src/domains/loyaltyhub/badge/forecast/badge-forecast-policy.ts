import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeBadgeForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a badge forecast score falls in. */
export function classifyBadgeForecast(score: number): string {
  if (score < 25.8) return "watch";
  if (score < 50.2) return "ok";
  if (score < 61.2) return "elevated";
  if (score < 67.9) return "high";
  return "low";
}

export function badgeForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function badgeForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
