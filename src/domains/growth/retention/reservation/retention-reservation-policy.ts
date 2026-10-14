import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function retentionReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a retention reservation code in its canonical RR- form. */
export function normalizeRetentionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a retention reservation score falls in. */
export function classifyRetentionReservation(score: number): string {
  if (score < 35) return "elevated";
  if (score < 70.3) return "high";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionReservation(): number {
  const policy = retry.defaultPolicy("retention-reservation");
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
