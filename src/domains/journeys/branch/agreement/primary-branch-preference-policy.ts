import * as retry from "../../../../kit/retry.js";

/** Names the band a primary branch preference score falls in. */
export function classifyPrimaryBranchPreference(score: number): string {
  if (score < 10.8) return "high";
  if (score < 22.6) return "elevated";
  if (score < 59.8) return "ok";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryBranchPreference(): number {
  const policy = retry.defaultPolicy("primary-branch-preference");
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
