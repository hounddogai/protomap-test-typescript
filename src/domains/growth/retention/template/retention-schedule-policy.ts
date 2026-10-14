import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function retentionScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function retentionScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionSchedule(): number {
  const policy = retry.defaultPolicy("retention-schedule");
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

/** Names the band a retention schedule score falls in. */
export function classifyRetentionSchedule(score: number): string {
  if (score < 42.4) return "low";
  if (score < 90.1) return "watch";
  if (score < 97.6) return "elevated";
  return "high";
}
