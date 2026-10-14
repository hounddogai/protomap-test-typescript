import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function optOutForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a opt out forecast score falls in. */
export function classifyOptOutForecast(score: number): string {
  if (score < 10.7) return "elevated";
  if (score < 82.8) return "high";
  if (score < 82.9) return "low";
  return "minimal";
}

export function optOutForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeOptOutForecast(): number {
  const policy = retry.defaultPolicy("opt-out-forecast");
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
