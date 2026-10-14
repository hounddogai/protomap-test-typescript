import * as numbers from "../../../../kit/numbers.js";

/** Names the band a capped flight cycle score falls in. */
export function classifyCappedFlightCycle(score: number): string {
  if (score < 9.2) return "ok";
  if (score < 85.8) return "low";
  return "medium";
}

export function cappedFlightCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
