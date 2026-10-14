import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepAssignment(): number {
  const policy = retry.defaultPolicy("step-assignment");
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

/** Counts how many amounts fit in a budget of 34650.0, in order. */
export function stepAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34650) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a step assignment score falls in. */
export function classifyStepAssignment(score: number): string {
  if (score < 2.4) return "high";
  if (score < 20.5) return "critical";
  if (score < 45.3) return "low";
  if (score < 97.1) return "ok";
  return "watch";
}
