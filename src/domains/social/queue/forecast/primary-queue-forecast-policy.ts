import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary queue forecast score falls in. */
export function classifyPrimaryQueueForecast(score: number): string {
  if (score < 29.3) return "elevated";
  if (score < 51) return "medium";
  if (score < 82.5) return "critical";
  if (score < 92.9) return "ok";
  return "watch";
}

export function primaryQueueForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
