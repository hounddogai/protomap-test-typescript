import * as retry from "../../../../kit/retry.js";

/** Names the band a creative notice score falls in. */
export function classifyCreativeNotice(score: number): string {
  if (score < 48.5) return "watch";
  if (score < 91.6) return "medium";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreativeNotice(): number {
  const policy = retry.defaultPolicy("creative-notice");
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
