import * as retry from "../../../../kit/retry.js";

/** Names the band a regional sender profile score falls in. */
export function classifyRegionalSenderProfile(score: number): string {
  if (score < 37.4) return "minimal";
  if (score < 63.2) return "ok";
  if (score < 88) return "elevated";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalSenderProfile(): number {
  const policy = retry.defaultPolicy("regional-sender-profile");
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
