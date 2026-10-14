import * as retry from "../../../../kit/retry.js";

/** Puts a rolling cohort plan code in its canonical RCP- form. */
export function normalizeRollingCohortPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCP-")) return clean;
  return `RCP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling cohort plan score falls in. */
export function classifyRollingCohortPlan(score: number): string {
  if (score < 7.5) return "elevated";
  if (score < 54.8) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingCohortPlan(): number {
  const policy = retry.defaultPolicy("rolling-cohort-plan");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function rollingCohortPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
