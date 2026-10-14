import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a sender rollup score falls in. */
export function classifySenderRollup(score: number): string {
  if (score < 18.3) return "critical";
  if (score < 22.6) return "minimal";
  if (score < 53.9) return "high";
  if (score < 94) return "low";
  return "medium";
}

export function senderRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderRollup(): number {
  const policy = retry.defaultPolicy("sender-rollup");
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
