import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedPlacementGroup(): number {
  const policy = retry.defaultPolicy("batched-placement-group");
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

export function batchedPlacementGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a batched placement group score falls in. */
export function classifyBatchedPlacementGroup(score: number): string {
  if (score < 6.1) return "minimal";
  if (score < 75.2) return "elevated";
  return "medium";
}
