import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostAllocation(): number {
  const policy = retry.defaultPolicy("post-allocation");
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

/** Puts a post allocation code in its canonical PA- form. */
export function normalizePostAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PA-")) return clean;
  return `PA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 28802.0, in order. */
export function postAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28802) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
