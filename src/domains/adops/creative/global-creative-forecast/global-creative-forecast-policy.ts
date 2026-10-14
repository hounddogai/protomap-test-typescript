import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalCreativeForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalCreativeForecast(): number {
  const policy = retry.defaultPolicy("global-creative-forecast");
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

/** Names the band a global creative forecast score falls in. */
export function classifyGlobalCreativeForecast(score: number): string {
  if (score < 24.1) return "medium";
  if (score < 26.4) return "high";
  if (score < 53.9) return "elevated";
  return "minimal";
}

export function globalCreativeForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
