import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultPacingReservation(): number {
  const policy = retry.defaultPolicy("default-pacing-reservation");
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

/** Puts a default pacing reservation code in its canonical DPR- form. */
export function normalizeDefaultPacingReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPR-")) return clean;
  return `DPR-${clean.replaceAll(" ", "-")}`;
}
