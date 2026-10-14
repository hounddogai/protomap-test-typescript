import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function scheduledDoubleOptInAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled double opt in allocation code in its canonical SDOIA- form. */
export function normalizeScheduledDoubleOptInAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDOIA-")) return clean;
  return `SDOIA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled double opt in allocation score falls in. */
export function classifyScheduledDoubleOptInAllocation(score: number): string {
  if (score < 29.8) return "watch";
  if (score < 65.9) return "elevated";
  if (score < 76.9) return "low";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledDoubleOptInAllocation(): number {
  const policy = retry.defaultPolicy("scheduled-double-opt-in-allocation");
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
