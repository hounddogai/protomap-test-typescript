import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function pendingWindowManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending window manifest code in its canonical PWM- form. */
export function normalizePendingWindowManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PWM-")) return clean;
  return `PWM-${clean.replaceAll(" ", "-")}`;
}

export function pendingWindowManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingWindowManifest(): number {
  const policy = retry.defaultPolicy("pending-window-manifest");
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
