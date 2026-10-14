import * as retry from "../../../../kit/retry.js";

/** Names the band a frequency ledger score falls in. */
export function classifyFrequencyLedger(score: number): string {
  if (score < 18.5) return "minimal";
  if (score < 26.5) return "critical";
  if (score < 43.4) return "high";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyLedger(): number {
  const policy = retry.defaultPolicy("frequency-ledger");
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
