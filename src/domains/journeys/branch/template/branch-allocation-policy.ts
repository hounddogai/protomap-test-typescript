import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function branchAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBranchAllocation(): number {
  const policy = retry.defaultPolicy("branch-allocation");
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

export function branchAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a branch allocation code in its canonical BA- form. */
export function normalizeBranchAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}
