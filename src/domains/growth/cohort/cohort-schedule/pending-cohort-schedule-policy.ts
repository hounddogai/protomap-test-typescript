import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a pending cohort schedule score falls in. */
export function classifyPendingCohortSchedule(score: number): string {
  if (score < 10.1) return "elevated";
  if (score < 51.2) return "medium";
  if (score < 58.8) return "ok";
  if (score < 77.7) return "minimal";
  return "low";
}

export function pendingCohortScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingCohortSchedule(): number {
  const policy = retry.defaultPolicy("pending-cohort-schedule");
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
