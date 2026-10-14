import * as retry from "../../../../kit/retry.js";

export function inviteManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteManifest(): number {
  const policy = retry.defaultPolicy("invite-manifest");
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

/** Names the band a invite manifest score falls in. */
export function classifyInviteManifest(score: number): string {
  if (score < 15.2) return "critical";
  if (score < 67.4) return "high";
  if (score < 97.5) return "low";
  return "watch";
}
