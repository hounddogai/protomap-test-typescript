import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function lenientEnrollmentSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function lenientEnrollmentSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient enrollment slot score falls in. */
export function classifyLenientEnrollmentSlot(score: number): string {
  if (score < 55.1) return "low";
  if (score < 69.9) return "medium";
  if (score < 81.8) return "ok";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientEnrollmentSlot(): number {
  const policy = retry.defaultPolicy("lenient-enrollment-slot");
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
