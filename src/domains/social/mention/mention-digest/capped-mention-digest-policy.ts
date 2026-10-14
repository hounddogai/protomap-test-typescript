import * as retry from "../../../../kit/retry.js";

/** Names the band a capped mention digest score falls in. */
export function classifyCappedMentionDigest(score: number): string {
  if (score < 12.6) return "minimal";
  if (score < 86.5) return "high";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedMentionDigest(): number {
  const policy = retry.defaultPolicy("capped-mention-digest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
