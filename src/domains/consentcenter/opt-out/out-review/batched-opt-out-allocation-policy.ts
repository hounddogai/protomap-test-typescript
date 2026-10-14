import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedOptOutAllocation(): number {
  const policy = retry.defaultPolicy("batched-opt-out-allocation");
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

export function batchedOptOutAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a batched opt out allocation code in its canonical BOOA- form. */
export function normalizeBatchedOptOutAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BOOA-")) return clean;
  return `BOOA-${clean.replaceAll(" ", "-")}`;
}
