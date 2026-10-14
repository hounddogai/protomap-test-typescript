import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceNotice(): number {
  const policy = retry.defaultPolicy("bounce-notice");
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

export function bounceNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a bounce notice score falls in. */
export function classifyBounceNotice(score: number): string {
  if (score < 82) return "low";
  if (score < 82.4) return "critical";
  return "high";
}

/** Counts how many amounts fit in a budget of 61285.0, in order. */
export function bounceNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61285) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
