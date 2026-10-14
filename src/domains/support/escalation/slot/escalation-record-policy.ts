import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationRecord(): number {
  const policy = retry.defaultPolicy("escalation-record");
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

export function escalationRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a escalation record code in its canonical ER- form. */
export function normalizeEscalationRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ER-")) return clean;
  return `ER-${clean.replaceAll(" ", "-")}`;
}

export function escalationRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
