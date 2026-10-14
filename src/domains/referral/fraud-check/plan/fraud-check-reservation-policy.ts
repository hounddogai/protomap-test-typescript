import * as retry from "../../../../kit/retry.js";

/** Puts a fraud check reservation code in its canonical FCR- form. */
export function normalizeFraudCheckReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCR-")) return clean;
  return `FCR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFraudCheckReservation(): number {
  const policy = retry.defaultPolicy("fraud-check-reservation");
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

export function fraudCheckReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
