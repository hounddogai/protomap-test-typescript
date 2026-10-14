import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a journey metric score falls in. */
export function classifyJourneyMetric(score: number): string {
  if (score < 24.1) return "critical";
  if (score < 46.2) return "watch";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyMetric(): number {
  const policy = retry.defaultPolicy("journey-metric");
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

export function journeyMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
