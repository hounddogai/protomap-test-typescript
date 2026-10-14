import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function weightedInsightPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedInsightPlan(): number {
  const policy = retry.defaultPolicy("weighted-insight-plan");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 44123.0, in order. */
export function weightedInsightPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44123) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted insight plan code in its canonical WIP- form. */
export function normalizeWeightedInsightPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WIP-")) return clean;
  return `WIP-${clean.replaceAll(" ", "-")}`;
}
