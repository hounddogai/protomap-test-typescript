import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function reputationRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReputationRecord(): number {
  const policy = retry.defaultPolicy("reputation-record");
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

/** Puts a reputation record code in its canonical RR- form. */
export function normalizeReputationRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

export function reputationRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
