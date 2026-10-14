import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryExitRuleAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 19994.0, in order. */
export function primaryExitRuleAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19994) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary exit rule agreement score falls in. */
export function classifyPrimaryExitRuleAgreement(score: number): string {
  if (score < 26.1) return "watch";
  if (score < 88.6) return "low";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryExitRuleAgreement(): number {
  const policy = retry.defaultPolicy("primary-exit-rule-agreement");
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
