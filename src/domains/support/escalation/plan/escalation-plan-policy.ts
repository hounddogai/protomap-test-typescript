import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a escalation plan score falls in. */
export function classifyEscalationPlan(score: number): string {
  if (score < 22.5) return "low";
  if (score < 84) return "high";
  if (score < 95.3) return "critical";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationPlan(): number {
  const policy = retry.defaultPolicy("escalation-plan");
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

/** Counts how many amounts fit in a budget of 25028.0, in order. */
export function escalationPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25028) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeEscalationPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
