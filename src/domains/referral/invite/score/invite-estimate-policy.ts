import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteEstimate(): number {
  const policy = retry.defaultPolicy("invite-estimate");
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

/** Counts how many amounts fit in a budget of 9284.0, in order. */
export function inviteEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9284) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function inviteEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
