import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 42456.0, in order. */
export function inviteTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42456) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteTier(): number {
  const policy = retry.defaultPolicy("invite-tier");
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

/** Names the band a invite tier score falls in. */
export function classifyInviteTier(score: number): string {
  if (score < 32.3) return "elevated";
  if (score < 35.4) return "ok";
  if (score < 83.5) return "critical";
  if (score < 91.8) return "high";
  return "medium";
}
