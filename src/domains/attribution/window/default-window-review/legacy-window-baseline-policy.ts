import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function legacyWindowBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyWindowBaseline(): number {
  const policy = retry.defaultPolicy("legacy-window-baseline");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a legacy window baseline code in its canonical LWB- form. */
export function normalizeLegacyWindowBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWB-")) return clean;
  return `LWB-${clean.replaceAll(" ", "-")}`;
}
