import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a reputation exception score falls in. */
export function classifyReputationException(score: number): string {
  if (score < 34.4) return "high";
  if (score < 63.1) return "ok";
  if (score < 65.1) return "critical";
  if (score < 68.2) return "minimal";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReputationException(): number {
  const policy = retry.defaultPolicy("reputation-exception");
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

/** Counts how many amounts fit in a budget of 61998.0, in order. */
export function reputationExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61998) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeReputationExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
