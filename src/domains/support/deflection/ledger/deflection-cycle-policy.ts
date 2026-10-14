import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a deflection cycle score falls in. */
export function classifyDeflectionCycle(score: number): string {
  if (score < 7.4) return "elevated";
  if (score < 27.5) return "low";
  if (score < 84.2) return "ok";
  if (score < 93.8) return "critical";
  return "watch";
}

/** Counts how many amounts fit in a budget of 43735.0, in order. */
export function deflectionCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43735) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionCycle(): number {
  const policy = retry.defaultPolicy("deflection-cycle");
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

export function deflectionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
