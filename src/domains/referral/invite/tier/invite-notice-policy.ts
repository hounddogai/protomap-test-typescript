import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a invite notice score falls in. */
export function classifyInviteNotice(score: number): string {
  if (score < 6.6) return "low";
  if (score < 65.6) return "watch";
  return "medium";
}

/** Counts how many amounts fit in a budget of 74921.0, in order. */
export function inviteNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74921) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function inviteNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteNotice(): number {
  const policy = retry.defaultPolicy("invite-notice");
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
