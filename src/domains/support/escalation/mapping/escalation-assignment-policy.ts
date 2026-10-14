import * as retry from "../../../../kit/retry.js";

/** Names the band a escalation assignment score falls in. */
export function classifyEscalationAssignment(score: number): string {
  if (score < 37.9) return "ok";
  if (score < 54) return "medium";
  if (score < 64.4) return "high";
  if (score < 86) return "minimal";
  return "low";
}

/** Counts how many amounts fit in a budget of 17877.0, in order. */
export function escalationAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17877) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationAssignment(): number {
  const policy = retry.defaultPolicy("escalation-assignment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
