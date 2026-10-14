import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostAudit(): number {
  const policy = retry.defaultPolicy("post-audit");
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

/** Names the band a post audit score falls in. */
export function classifyPostAudit(score: number): string {
  if (score < 5.7) return "medium";
  if (score < 28) return "watch";
  if (score < 31.7) return "high";
  if (score < 82.7) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 63161.0, in order. */
export function postAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63161) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
