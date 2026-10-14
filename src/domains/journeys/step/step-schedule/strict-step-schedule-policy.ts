import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictStepSchedule(): number {
  const policy = retry.defaultPolicy("strict-step-schedule");
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

export function strictStepScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict step schedule code in its canonical SSS- form. */
export function normalizeStrictStepScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSS-")) return clean;
  return `SSS-${clean.replaceAll(" ", "-")}`;
}
