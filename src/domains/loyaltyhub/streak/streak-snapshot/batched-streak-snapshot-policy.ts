import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function batchedStreakSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedStreakSnapshot(): number {
  const policy = retry.defaultPolicy("batched-streak-snapshot");
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

export function batchedStreakSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
