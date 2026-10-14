import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingCohortDraft(): number {
  const policy = retry.defaultPolicy("rolling-cohort-draft");
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

export function rollingCohortDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a rolling cohort draft score falls in. */
export function classifyRollingCohortDraft(score: number): string {
  if (score < 35.3) return "medium";
  if (score < 43) return "high";
  if (score < 50.4) return "ok";
  if (score < 87.5) return "minimal";
  return "watch";
}

export function rollingCohortDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
