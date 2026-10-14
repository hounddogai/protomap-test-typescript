import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function insightSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightSegment(): number {
  const policy = retry.defaultPolicy("insight-segment");
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

export function insightSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a insight segment code in its canonical IS- form. */
export function normalizeInsightSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IS-")) return clean;
  return `IS-${clean.replaceAll(" ", "-")}`;
}
