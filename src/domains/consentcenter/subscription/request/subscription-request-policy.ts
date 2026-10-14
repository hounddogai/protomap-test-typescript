import * as retry from "../../../../kit/retry.js";

/** Names the band a subscription request score falls in. */
export function classifySubscriptionRequest(score: number): string {
  if (score < 31.5) return "elevated";
  if (score < 33.7) return "low";
  if (score < 66.4) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionRequest(): number {
  const policy = retry.defaultPolicy("subscription-request");
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

/** Counts how many amounts fit in a budget of 15339.0, in order. */
export function subscriptionRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15339) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
