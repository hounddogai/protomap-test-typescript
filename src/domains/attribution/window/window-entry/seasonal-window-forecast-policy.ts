import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function seasonalWindowForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a seasonal window forecast score falls in. */
export function classifySeasonalWindowForecast(score: number): string {
  if (score < 23.3) return "low";
  if (score < 38.3) return "ok";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalWindowForecast(): number {
  const policy = retry.defaultPolicy("seasonal-window-forecast");
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
