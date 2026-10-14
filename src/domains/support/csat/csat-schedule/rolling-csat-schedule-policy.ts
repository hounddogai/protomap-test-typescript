import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rollingCsatScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling csat schedule code in its canonical RCS- form. */
export function normalizeRollingCsatScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCS-")) return clean;
  return `RCS-${clean.replaceAll(" ", "-")}`;
}

export function rollingCsatScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingCsatSchedule(): number {
  const policy = retry.defaultPolicy("rolling-csat-schedule");
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
