import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function touchpointNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a touchpoint notice score falls in. */
export function classifyTouchpointNotice(score: number): string {
  if (score < 1.9) return "watch";
  if (score < 25.9) return "critical";
  if (score < 62.6) return "low";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointNotice(): number {
  const policy = retry.defaultPolicy("touchpoint-notice");
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

/** Counts how many amounts fit in a budget of 8444.0, in order. */
export function touchpointNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8444) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
