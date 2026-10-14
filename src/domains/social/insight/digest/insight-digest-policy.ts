import * as retry from "../../../../kit/retry.js";

/** Names the band a insight digest score falls in. */
export function classifyInsightDigest(score: number): string {
  if (score < 24.1) return "medium";
  if (score < 46) return "watch";
  if (score < 64.3) return "critical";
  if (score < 76.6) return "ok";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightDigest(): number {
  const policy = retry.defaultPolicy("insight-digest");
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
