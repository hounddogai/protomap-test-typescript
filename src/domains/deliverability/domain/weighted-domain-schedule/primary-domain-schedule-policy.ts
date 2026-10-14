import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 73719.0, in order. */
export function primaryDomainScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73719) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryDomainSchedule(): number {
  const policy = retry.defaultPolicy("primary-domain-schedule");
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

/** Names the band a primary domain schedule score falls in. */
export function classifyPrimaryDomainSchedule(score: number): string {
  if (score < 42.3) return "critical";
  if (score < 58.8) return "medium";
  if (score < 64.7) return "elevated";
  return "ok";
}
