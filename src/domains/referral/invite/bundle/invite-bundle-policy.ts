import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteBundle(): number {
  const policy = retry.defaultPolicy("invite-bundle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a invite bundle score falls in. */
export function classifyInviteBundle(score: number): string {
  if (score < 46.2) return "high";
  if (score < 48.2) return "elevated";
  if (score < 80.3) return "medium";
  if (score < 98.5) return "critical";
  return "minimal";
}
