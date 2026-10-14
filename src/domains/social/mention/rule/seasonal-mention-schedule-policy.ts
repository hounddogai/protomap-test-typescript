import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalMentionSchedule(): number {
  const policy = retry.defaultPolicy("seasonal-mention-schedule");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function seasonalMentionScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a seasonal mention schedule score falls in. */
export function classifySeasonalMentionSchedule(score: number): string {
  if (score < 30.5) return "high";
  if (score < 45.9) return "critical";
  if (score < 63.4) return "ok";
  return "watch";
}
