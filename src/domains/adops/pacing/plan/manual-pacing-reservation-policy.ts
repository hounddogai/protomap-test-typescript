import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a manual pacing reservation code in its canonical MPR- form. */
export function normalizeManualPacingReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPR-")) return clean;
  return `MPR-${clean.replaceAll(" ", "-")}`;
}

export function manualPacingReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualPacingReservation(): number {
  const policy = retry.defaultPolicy("manual-pacing-reservation");
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

export function manualPacingReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
