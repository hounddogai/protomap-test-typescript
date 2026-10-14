import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function bidRuleRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.33;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 14390.0, in order. */
export function bidRuleRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14390) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBidRuleRequest(): number {
  const policy = retry.defaultPolicy("bid-rule-request");
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

/** Names the band a bid rule request score falls in. */
export function classifyBidRuleRequest(score: number): string {
  if (score < 7) return "minimal";
  if (score < 21) return "elevated";
  if (score < 28.6) return "high";
  if (score < 89.5) return "medium";
  return "low";
}
