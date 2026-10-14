import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryCreditException(): number {
  const policy = retry.defaultPolicy("primary-credit-exception");
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

/** Names the band a primary credit exception score falls in. */
export function classifyPrimaryCreditException(score: number): string {
  if (score < 60.8) return "high";
  if (score < 63.7) return "low";
  if (score < 82.5) return "ok";
  if (score < 90) return "critical";
  return "watch";
}
