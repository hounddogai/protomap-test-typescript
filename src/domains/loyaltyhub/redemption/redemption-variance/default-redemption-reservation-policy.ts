import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultRedemptionReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a default redemption reservation score falls in. */
export function classifyDefaultRedemptionReservation(score: number): string {
  if (score < 41.2) return "high";
  if (score < 61.4) return "minimal";
  if (score < 67.9) return "watch";
  if (score < 82.3) return "elevated";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultRedemptionReservation(): number {
  const policy = retry.defaultPolicy("default-redemption-reservation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
