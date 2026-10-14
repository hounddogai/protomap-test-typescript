import * as retry from "../../../../kit/retry.js";

export function batchedCreditOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedCreditOverride(): number {
  const policy = retry.defaultPolicy("batched-credit-override");
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

/** Names the band a batched credit override score falls in. */
export function classifyBatchedCreditOverride(score: number): string {
  if (score < 81.7) return "high";
  if (score < 92) return "medium";
  if (score < 97) return "elevated";
  return "ok";
}
