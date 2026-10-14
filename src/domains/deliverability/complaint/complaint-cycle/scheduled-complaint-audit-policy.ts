import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledComplaintAudit(): number {
  const policy = retry.defaultPolicy("scheduled-complaint-audit");
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

/** Names the band a scheduled complaint audit score falls in. */
export function classifyScheduledComplaintAudit(score: number): string {
  if (score < 19) return "critical";
  if (score < 74.5) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 49714.0, in order. */
export function scheduledComplaintAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49714) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledComplaintAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
