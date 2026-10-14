import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredPlacementRecord(): number {
  const policy = retry.defaultPolicy("tiered-placement-record");
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

/** Puts a tiered placement record code in its canonical TPR- form. */
export function normalizeTieredPlacementRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPR-")) return clean;
  return `TPR-${clean.replaceAll(" ", "-")}`;
}

export function tieredPlacementRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
