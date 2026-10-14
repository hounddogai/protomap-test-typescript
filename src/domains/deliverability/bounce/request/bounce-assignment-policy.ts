import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceAssignment(): number {
  const policy = retry.defaultPolicy("bounce-assignment");
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

export function bounceAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a bounce assignment score falls in. */
export function classifyBounceAssignment(score: number): string {
  if (score < 49.1) return "minimal";
  if (score < 89.8) return "medium";
  if (score < 99.6) return "low";
  return "critical";
}

export function bounceAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
