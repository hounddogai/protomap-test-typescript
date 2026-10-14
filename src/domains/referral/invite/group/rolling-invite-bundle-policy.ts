import * as retry from "../../../../kit/retry.js";

/** Names the band a rolling invite bundle score falls in. */
export function classifyRollingInviteBundle(score: number): string {
  if (score < 24.5) return "watch";
  if (score < 95.7) return "critical";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingInviteBundle(): number {
  const policy = retry.defaultPolicy("rolling-invite-bundle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
