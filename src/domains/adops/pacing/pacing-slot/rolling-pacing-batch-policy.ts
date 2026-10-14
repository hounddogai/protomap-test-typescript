import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rollingPacingBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingPacingBatch(): number {
  const policy = retry.defaultPolicy("rolling-pacing-batch");
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

/** Puts a rolling pacing batch code in its canonical RPB- form. */
export function normalizeRollingPacingBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPB-")) return clean;
  return `RPB-${clean.replaceAll(" ", "-")}`;
}
