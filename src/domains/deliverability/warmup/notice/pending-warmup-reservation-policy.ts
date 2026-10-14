import * as numbers from "../../../../kit/numbers.js";

export function pendingWarmupReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a pending warmup reservation score falls in. */
export function classifyPendingWarmupReservation(score: number): string {
  if (score < 15.9) return "critical";
  if (score < 58.7) return "minimal";
  if (score < 76.4) return "ok";
  return "low";
}
