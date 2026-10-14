import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a sender exception score falls in. */
export function classifySenderException(score: number): string {
  if (score < 25.9) return "high";
  if (score < 52.6) return "low";
  if (score < 72.4) return "watch";
  return "ok";
}

export function senderExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderException(): number {
  const policy = retry.defaultPolicy("sender-exception");
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
