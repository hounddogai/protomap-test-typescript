import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryApprovalAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 41542.0, in order. */
export function primaryApprovalAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41542) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryApprovalAgreement(): number {
  const policy = retry.defaultPolicy("primary-approval-agreement");
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

/** Names the band a primary approval agreement score falls in. */
export function classifyPrimaryApprovalAgreement(score: number): string {
  if (score < 30.6) return "high";
  if (score < 44) return "watch";
  if (score < 57.1) return "minimal";
  if (score < 70.9) return "critical";
  return "ok";
}
