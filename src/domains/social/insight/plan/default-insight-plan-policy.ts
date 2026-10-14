import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a default insight plan score falls in. */
export function classifyDefaultInsightPlan(score: number): string {
  if (score < 24) return "watch";
  if (score < 92.5) return "low";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultInsightPlan(): number {
  const policy = retry.defaultPolicy("default-insight-plan");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function defaultInsightPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function defaultInsightPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
