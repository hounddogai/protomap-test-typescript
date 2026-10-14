import * as numbers from "../../../../kit/numbers.js";

export function lenientTouchpointReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function lenientTouchpointReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a lenient touchpoint reservation score falls in. */
export function classifyLenientTouchpointReservation(score: number): string {
  if (score < 37.4) return "minimal";
  if (score < 64.3) return "ok";
  if (score < 75.7) return "medium";
  if (score < 89.4) return "critical";
  return "high";
}

export function lenientTouchpointReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
