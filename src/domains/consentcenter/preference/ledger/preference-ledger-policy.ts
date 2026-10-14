import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePreferenceLedger(): number {
  const policy = retry.defaultPolicy("preference-ledger");
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

/** Names the band a preference ledger score falls in. */
export function classifyPreferenceLedger(score: number): string {
  if (score < 10.7) return "high";
  if (score < 47.1) return "minimal";
  if (score < 78.6) return "medium";
  return "low";
}

export function preferenceLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
