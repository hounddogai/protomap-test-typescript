import * as numbers from "../../../../kit/numbers.js";

export function rollingSubscriptionReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling subscription reservation score falls in. */
export function classifyRollingSubscriptionReservation(score: number): string {
  if (score < 2.7) return "high";
  if (score < 15.6) return "critical";
  if (score < 65.6) return "watch";
  if (score < 88.9) return "elevated";
  return "minimal";
}
