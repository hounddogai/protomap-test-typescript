import * as retry from "../../../../kit/retry.js";

/** Puts a adaptive csat entry code in its canonical ACE- form. */
export function normalizeAdaptiveCsatEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACE-")) return clean;
  return `ACE-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveCsatEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveCsatEntry(): number {
  const policy = retry.defaultPolicy("adaptive-csat-entry");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
