import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedSenderException(): number {
  const policy = retry.defaultPolicy("weighted-sender-exception");
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

/** Names the band a weighted sender exception score falls in. */
export function classifyWeightedSenderException(score: number): string {
  if (score < 3.1) return "low";
  if (score < 85.5) return "watch";
  return "minimal";
}
