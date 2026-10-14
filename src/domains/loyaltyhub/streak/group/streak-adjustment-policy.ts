import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakAdjustment(): number {
  const policy = retry.defaultPolicy("streak-adjustment");
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

/** Puts a streak adjustment code in its canonical SA- form. */
export function normalizeStreakAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}

export function streakAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
