import * as retry from "../../../../kit/retry.js";

/** Names the band a manual credit claim score falls in. */
export function classifyManualCreditClaim(score: number): string {
  if (score < 17.2) return "critical";
  if (score < 44.8) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualCreditClaim(): number {
  const policy = retry.defaultPolicy("manual-credit-claim");
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

export function manualCreditClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 15508.0, in order. */
export function manualCreditClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15508) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
