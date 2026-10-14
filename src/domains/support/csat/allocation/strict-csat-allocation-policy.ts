import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictCsatAllocation(): number {
  const policy = retry.defaultPolicy("strict-csat-allocation");
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

/** Puts a strict csat allocation code in its canonical SCA- form. */
export function normalizeStrictCsatAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCA-")) return clean;
  return `SCA-${clean.replaceAll(" ", "-")}`;
}

export function strictCsatAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a strict csat allocation score falls in. */
export function classifyStrictCsatAllocation(score: number): string {
  if (score < 23.2) return "elevated";
  if (score < 82.9) return "high";
  return "ok";
}
