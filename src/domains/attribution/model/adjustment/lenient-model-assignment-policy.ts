import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient model assignment score falls in. */
export function classifyLenientModelAssignment(score: number): string {
  if (score < 16.5) return "minimal";
  if (score < 63.4) return "medium";
  if (score < 92) return "high";
  return "critical";
}

export function lenientModelAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientModelAssignment(): number {
  const policy = retry.defaultPolicy("lenient-model-assignment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
