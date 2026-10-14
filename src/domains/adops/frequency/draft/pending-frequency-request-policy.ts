import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a pending frequency request score falls in. */
export function classifyPendingFrequencyRequest(score: number): string {
  if (score < 9.6) return "critical";
  if (score < 24.9) return "watch";
  if (score < 31.1) return "low";
  if (score < 70.8) return "medium";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingFrequencyRequest(): number {
  const policy = retry.defaultPolicy("pending-frequency-request");
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

export function pendingFrequencyRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
