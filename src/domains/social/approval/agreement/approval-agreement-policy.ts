import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalAgreement(): number {
  const policy = retry.defaultPolicy("approval-agreement");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function approvalAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.89;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeApprovalAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a approval agreement score falls in. */
export function classifyApprovalAgreement(score: number): string {
  if (score < 44.6) return "low";
  if (score < 51.9) return "critical";
  return "watch";
}
