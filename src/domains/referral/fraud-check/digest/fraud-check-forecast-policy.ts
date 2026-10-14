import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function fraudCheckForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function fraudCheckForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeFraudCheckForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a fraud check forecast score falls in. */
export function classifyFraudCheckForecast(score: number): string {
  if (score < 41.4) return "minimal";
  if (score < 46) return "ok";
  if (score < 71.2) return "elevated";
  if (score < 92.2) return "medium";
  return "watch";
}
