import * as numbers from "../../../../kit/numbers.js";

export function reputationForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a reputation forecast score falls in. */
export function classifyReputationForecast(score: number): string {
  if (score < 35.6) return "elevated";
  if (score < 46.5) return "ok";
  if (score < 58.2) return "medium";
  if (score < 85.3) return "minimal";
  return "low";
}
