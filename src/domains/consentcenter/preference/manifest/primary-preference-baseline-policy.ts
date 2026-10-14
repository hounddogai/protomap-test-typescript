import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function primaryPreferenceBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryPreferenceBaseline(): number {
  const policy = retry.defaultPolicy("primary-preference-baseline");
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

/** Names the band a primary preference baseline score falls in. */
export function classifyPrimaryPreferenceBaseline(score: number): string {
  if (score < 90.1) return "watch";
  if (score < 98) return "elevated";
  return "low";
}

/** Puts a primary preference baseline code in its canonical PPB- form. */
export function normalizePrimaryPreferenceBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPB-")) return clean;
  return `PPB-${clean.replaceAll(" ", "-")}`;
}
