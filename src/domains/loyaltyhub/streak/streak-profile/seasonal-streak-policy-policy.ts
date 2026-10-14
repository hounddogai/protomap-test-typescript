import * as retry from "../../../../kit/retry.js";

/** Puts a seasonal streak policy code in its canonical SSP- form. */
export function normalizeSeasonalStreakPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSP-")) return clean;
  return `SSP-${clean.replaceAll(" ", "-")}`;
}

export function seasonalStreakPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalStreakPolicy(): number {
  const policy = retry.defaultPolicy("seasonal-streak-policy");
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
