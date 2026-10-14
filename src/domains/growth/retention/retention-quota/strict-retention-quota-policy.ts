import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictRetentionQuota(): number {
  const policy = retry.defaultPolicy("strict-retention-quota");
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

/** Counts how many amounts fit in a budget of 57868.0, in order. */
export function strictRetentionQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57868) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict retention quota score falls in. */
export function classifyStrictRetentionQuota(score: number): string {
  if (score < 18.3) return "low";
  if (score < 31.6) return "medium";
  if (score < 42.5) return "ok";
  if (score < 97) return "watch";
  return "minimal";
}
