import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function nudgeForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a nudge forecast score falls in. */
export function classifyNudgeForecast(score: number): string {
  if (score < 44.6) return "low";
  if (score < 52.5) return "ok";
  if (score < 63.2) return "watch";
  if (score < 68.7) return "minimal";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeNudgeForecast(): number {
  const policy = retry.defaultPolicy("nudge-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
