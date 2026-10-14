import * as numbers from "../../../../kit/numbers.js";

export function primarySenderCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a primary sender checkpoint score falls in. */
export function classifyPrimarySenderCheckpoint(score: number): string {
  if (score < 42.4) return "critical";
  if (score < 56.3) return "medium";
  return "ok";
}
