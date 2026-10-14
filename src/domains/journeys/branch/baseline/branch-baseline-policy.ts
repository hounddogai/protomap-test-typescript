import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBranchBaseline(): number {
  const policy = retry.defaultPolicy("branch-baseline");
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

/** Names the band a branch baseline score falls in. */
export function classifyBranchBaseline(score: number): string {
  if (score < 8.1) return "high";
  if (score < 45.1) return "elevated";
  return "medium";
}

export function branchBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
