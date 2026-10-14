import * as retry from "../../../../kit/retry.js";

/** Names the band a challenge agreement score falls in. */
export function classifyChallengeAgreement(score: number): string {
  if (score < 10.1) return "low";
  if (score < 46.7) return "minimal";
  if (score < 67.5) return "critical";
  if (score < 76.1) return "high";
  return "ok";
}

export function challengeAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeChallengeAgreement(): number {
  const policy = retry.defaultPolicy("challenge-agreement");
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
