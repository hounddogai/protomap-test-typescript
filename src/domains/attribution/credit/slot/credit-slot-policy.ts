import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function creditSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a credit slot score falls in. */
export function classifyCreditSlot(score: number): string {
  if (score < 25.4) return "elevated";
  if (score < 90.5) return "minimal";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditSlot(): number {
  const policy = retry.defaultPolicy("credit-slot");
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
