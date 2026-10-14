import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptivePreferencePolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive preference policy code in its canonical APP- form. */
export function normalizeAdaptivePreferencePolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APP-")) return clean;
  return `APP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive preference policy score falls in. */
export function classifyAdaptivePreferencePolicy(score: number): string {
  if (score < 2.2) return "watch";
  if (score < 26.2) return "critical";
  if (score < 36.6) return "high";
  if (score < 46.1) return "medium";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePreferencePolicy(): number {
  const policy = retry.defaultPolicy("adaptive-preference-policy");
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
