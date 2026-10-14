import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function streakAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a streak audit code in its canonical SA- form. */
export function normalizeStreakAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}

export function streakAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakAudit(): number {
  const policy = retry.defaultPolicy("streak-audit");
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
