import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveTierAllocation(): number {
  const policy = retry.defaultPolicy("adaptive-tier-allocation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 64788.0, in order. */
export function adaptiveTierAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64788) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a adaptive tier allocation code in its canonical ATA- form. */
export function normalizeAdaptiveTierAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ATA-")) return clean;
  return `ATA-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveTierAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
