import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 33003.0, in order. */
export function rollingFrequencyLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33003) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a rolling frequency ledger score falls in. */
export function classifyRollingFrequencyLedger(score: number): string {
  if (score < 34.9) return "watch";
  if (score < 39.4) return "elevated";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingFrequencyLedger(): number {
  const policy = retry.defaultPolicy("rolling-frequency-ledger");
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
