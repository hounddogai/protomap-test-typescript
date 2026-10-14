import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryTierForecast(): number {
  const policy = retry.defaultPolicy("primary-tier-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function primaryTierForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function primaryTierForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a primary tier forecast score falls in. */
export function classifyPrimaryTierForecast(score: number): string {
  if (score < 18.8) return "high";
  if (score < 48.1) return "elevated";
  if (score < 64) return "minimal";
  if (score < 70.4) return "watch";
  return "low";
}
