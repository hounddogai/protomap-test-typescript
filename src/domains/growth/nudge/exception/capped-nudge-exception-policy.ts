import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedNudgeException(): number {
  const policy = retry.defaultPolicy("capped-nudge-exception");
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

export function cappedNudgeExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a capped nudge exception code in its canonical CNE- form. */
export function normalizeCappedNudgeExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CNE-")) return clean;
  return `CNE-${clean.replaceAll(" ", "-")}`;
}
