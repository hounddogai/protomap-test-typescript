import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictSenderDigest(): number {
  const policy = retry.defaultPolicy("strict-sender-digest");
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

/** Names the band a strict sender digest score falls in. */
export function classifyStrictSenderDigest(score: number): string {
  if (score < 4.2) return "low";
  if (score < 30.8) return "high";
  if (score < 50.6) return "critical";
  if (score < 74.6) return "ok";
  return "watch";
}

/** Counts how many amounts fit in a budget of 91336.0, in order. */
export function strictSenderDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91336) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
