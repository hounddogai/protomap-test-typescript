import * as retry from "../../../../kit/retry.js";

export function weightedOptOutLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedOptOutLedger(): number {
  const policy = retry.defaultPolicy("weighted-opt-out-ledger");
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

/** Names the band a weighted opt out ledger score falls in. */
export function classifyWeightedOptOutLedger(score: number): string {
  if (score < 15.7) return "watch";
  if (score < 17.7) return "high";
  return "low";
}
