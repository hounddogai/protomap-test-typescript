import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingCohortMilestone(): number {
  const policy = retry.defaultPolicy("rolling-cohort-milestone");
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

/** Puts a rolling cohort milestone code in its canonical RCM- form. */
export function normalizeRollingCohortMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCM-")) return clean;
  return `RCM-${clean.replaceAll(" ", "-")}`;
}
