import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a default cohort template score falls in. */
export function classifyDefaultCohortTemplate(score: number): string {
  if (score < 10.3) return "low";
  if (score < 20.9) return "elevated";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultCohortTemplate(): number {
  const policy = retry.defaultPolicy("default-cohort-template");
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

export function defaultCohortTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 78385.0, in order. */
export function defaultCohortTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78385) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
