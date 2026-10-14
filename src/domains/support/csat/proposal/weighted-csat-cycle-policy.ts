import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function weightedCsatCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a weighted csat cycle code in its canonical WCC- form. */
export function normalizeWeightedCsatCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WCC-")) return clean;
  return `WCC-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedCsatCycle(): number {
  const policy = retry.defaultPolicy("weighted-csat-cycle");
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
