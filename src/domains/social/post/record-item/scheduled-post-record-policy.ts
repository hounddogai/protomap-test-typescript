import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledPostRecord(): number {
  const policy = retry.defaultPolicy("scheduled-post-record");
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

export function scheduledPostRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function scheduledPostRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a scheduled post record code in its canonical SPR- form. */
export function normalizeScheduledPostRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPR-")) return clean;
  return `SPR-${clean.replaceAll(" ", "-")}`;
}
