import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 46166.0, in order. */
export function creditRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 46166) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a credit record score falls in. */
export function classifyCreditRecord(score: number): string {
  if (score < 6.7) return "elevated";
  if (score < 69.3) return "critical";
  if (score < 90.3) return "medium";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditRecord(): number {
  const policy = retry.defaultPolicy("credit-record");
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
