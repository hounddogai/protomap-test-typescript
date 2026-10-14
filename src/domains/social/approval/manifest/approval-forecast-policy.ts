import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 87995.0, in order. */
export function approvalForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87995) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeApprovalForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalForecast(): number {
  const policy = retry.defaultPolicy("approval-forecast");
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

/** Names the band a approval forecast score falls in. */
export function classifyApprovalForecast(score: number): string {
  if (score < 18.9) return "minimal";
  if (score < 86.7) return "medium";
  if (score < 88) return "elevated";
  return "high";
}
