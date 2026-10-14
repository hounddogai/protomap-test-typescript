import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingLevelBatch(): number {
  const policy = retry.defaultPolicy("rolling-level-batch");
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

/** Names the band a rolling level batch score falls in. */
export function classifyRollingLevelBatch(score: number): string {
  if (score < 4.2) return "watch";
  if (score < 59.7) return "elevated";
  if (score < 85.6) return "critical";
  return "medium";
}

export function rollingLevelBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
