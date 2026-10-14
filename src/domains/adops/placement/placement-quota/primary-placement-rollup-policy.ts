import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a primary placement rollup code in its canonical PPR- form. */
export function normalizePrimaryPlacementRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPR-")) return clean;
  return `PPR-${clean.replaceAll(" ", "-")}`;
}

export function primaryPlacementRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryPlacementRollup(): number {
  const policy = retry.defaultPolicy("primary-placement-rollup");
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
