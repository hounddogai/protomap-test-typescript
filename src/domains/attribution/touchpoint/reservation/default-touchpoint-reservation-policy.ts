import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a default touchpoint reservation code in its canonical DTR- form. */
export function normalizeDefaultTouchpointReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DTR-")) return clean;
  return `DTR-${clean.replaceAll(" ", "-")}`;
}

export function defaultTouchpointReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultTouchpointReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultTouchpointReservation(): number {
  const policy = retry.defaultPolicy("default-touchpoint-reservation");
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
