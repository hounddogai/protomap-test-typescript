import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledCohortException(): number {
  const policy = retry.defaultPolicy("scheduled-cohort-exception");
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

export function scheduledCohortExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled cohort exception code in its canonical SCE- form. */
export function normalizeScheduledCohortExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCE-")) return clean;
  return `SCE-${clean.replaceAll(" ", "-")}`;
}
