import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyDoubleOptInLedger(): number {
  const policy = retry.defaultPolicy("legacy-double-opt-in-ledger");
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

export function legacyDoubleOptInLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 22029.0, in order. */
export function legacyDoubleOptInLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22029) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a legacy double opt in ledger score falls in. */
export function classifyLegacyDoubleOptInLedger(score: number): string {
  if (score < 29.5) return "medium";
  if (score < 63.7) return "watch";
  if (score < 81.7) return "low";
  return "minimal";
}
