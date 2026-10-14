import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionProfile(): number {
  const policy = retry.defaultPolicy("deflection-profile");
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

export function deflectionProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function deflectionProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a deflection profile code in its canonical DP- form. */
export function normalizeDeflectionProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DP-")) return clean;
  return `DP-${clean.replaceAll(" ", "-")}`;
}
