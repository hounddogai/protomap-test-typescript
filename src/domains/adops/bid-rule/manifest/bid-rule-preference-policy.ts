import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a bid rule preference score falls in. */
export function classifyBidRulePreference(score: number): string {
  if (score < 15.7) return "low";
  if (score < 69.6) return "minimal";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBidRulePreference(): number {
  const policy = retry.defaultPolicy("bid-rule-preference");
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

export function bidRulePreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
