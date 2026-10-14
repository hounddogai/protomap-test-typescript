import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeProofRollup(): number {
  const policy = retry.defaultPolicy("proof-rollup");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a proof rollup code in its canonical PR- form. */
export function normalizeProofRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

export function proofRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 66206.0, in order. */
export function proofRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66206) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
