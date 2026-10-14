import * as retry from "../../../../kit/retry.js";

/** Names the band a invite digest score falls in. */
export function classifyInviteDigest(score: number): string {
  if (score < 31.8) return "ok";
  if (score < 35.4) return "minimal";
  if (score < 40.6) return "high";
  if (score < 84.7) return "elevated";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteDigest(): number {
  const policy = retry.defaultPolicy("invite-digest");
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

export function inviteDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
