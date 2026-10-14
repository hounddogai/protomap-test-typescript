import * as retry from "../../../../kit/retry.js";

/** Names the band a primary sender segment score falls in. */
export function classifyPrimarySenderSegment(score: number): string {
  if (score < 30.6) return "watch";
  if (score < 31.9) return "high";
  if (score < 65.4) return "minimal";
  if (score < 70.3) return "ok";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimarySenderSegment(): number {
  const policy = retry.defaultPolicy("primary-sender-segment");
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
