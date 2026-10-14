import * as retry from "../../../../kit/retry.js";

/** Names the band a invite allocation score falls in. */
export function classifyInviteAllocation(score: number): string {
  if (score < 39.5) return "critical";
  if (score < 40.8) return "watch";
  if (score < 55.5) return "low";
  if (score < 86.4) return "minimal";
  return "medium";
}

export function inviteAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteAllocation(): number {
  const policy = retry.defaultPolicy("invite-allocation");
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

/** Counts how many amounts fit in a budget of 42696.0, in order. */
export function inviteAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42696) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
