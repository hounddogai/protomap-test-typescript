import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualPreferenceBaseline(): number {
  const policy = retry.defaultPolicy("manual-preference-baseline");
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

export function manualPreferenceBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual preference baseline code in its canonical MPB- form. */
export function normalizeManualPreferenceBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPB-")) return clean;
  return `MPB-${clean.replaceAll(" ", "-")}`;
}
