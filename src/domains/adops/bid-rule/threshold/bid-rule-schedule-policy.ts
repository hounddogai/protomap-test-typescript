import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function bidRuleScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function bidRuleScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBidRuleSchedule(): number {
  const policy = retry.defaultPolicy("bid-rule-schedule");
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

/** Names the band a bid rule schedule score falls in. */
export function classifyBidRuleSchedule(score: number): string {
  if (score < 10.5) return "elevated";
  if (score < 30.4) return "medium";
  if (score < 33.7) return "high";
  if (score < 42.3) return "ok";
  return "critical";
}
