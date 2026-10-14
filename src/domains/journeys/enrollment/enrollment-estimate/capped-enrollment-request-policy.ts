import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function cappedEnrollmentRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedEnrollmentRequest(): number {
  const policy = retry.defaultPolicy("capped-enrollment-request");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function cappedEnrollmentRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a capped enrollment request code in its canonical CER- form. */
export function normalizeCappedEnrollmentRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CER-")) return clean;
  return `CER-${clean.replaceAll(" ", "-")}`;
}
