import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 99346.0, in order. */
export function creativeBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99346) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a creative bundle score falls in. */
export function classifyCreativeBundle(score: number): string {
  if (score < 31.5) return "elevated";
  if (score < 38.5) return "critical";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreativeBundle(): number {
  const policy = retry.defaultPolicy("creative-bundle");
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

export function creativeBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
