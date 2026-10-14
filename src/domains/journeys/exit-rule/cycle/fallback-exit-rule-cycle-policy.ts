import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function fallbackExitRuleCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackExitRuleCycle(): number {
  const policy = retry.defaultPolicy("fallback-exit-rule-cycle");
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

/** Counts how many amounts fit in a budget of 6475.0, in order. */
export function fallbackExitRuleCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6475) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
