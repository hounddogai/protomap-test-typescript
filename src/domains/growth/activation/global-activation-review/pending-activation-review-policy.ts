import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingActivationReview(): number {
  const policy = retry.defaultPolicy("pending-activation-review");
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

export function pendingActivationReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function pendingActivationReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
