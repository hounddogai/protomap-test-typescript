import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 41785.0, in order. */
export function batchedReputationBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41785) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedReputationBundle(): number {
  const policy = retry.defaultPolicy("batched-reputation-bundle");
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

export function batchedReputationBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a batched reputation bundle code in its canonical BRB- form. */
export function normalizeBatchedReputationBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRB-")) return clean;
  return `BRB-${clean.replaceAll(" ", "-")}`;
}
