import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rollingLevelAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling level allocation score falls in. */
export function classifyRollingLevelAllocation(score: number): string {
  if (score < 58) return "ok";
  if (score < 65.1) return "high";
  return "elevated";
}

/** Puts a rolling level allocation code in its canonical RLA- form. */
export function normalizeRollingLevelAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RLA-")) return clean;
  return `RLA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingLevelAllocation(): number {
  const policy = retry.defaultPolicy("rolling-level-allocation");
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
