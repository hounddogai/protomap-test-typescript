import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeNudgeReservation(): number {
  const policy = retry.defaultPolicy("nudge-reservation");
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

/** Puts a nudge reservation code in its canonical NR- form. */
export function normalizeNudgeReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NR-")) return clean;
  return `NR-${clean.replaceAll(" ", "-")}`;
}

export function nudgeReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
