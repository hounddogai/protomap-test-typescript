import * as retry from "../../../../kit/retry.js";

export function adaptivePayoutAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePayoutAssignment(): number {
  const policy = retry.defaultPolicy("adaptive-payout-assignment");
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

/** Puts a adaptive payout assignment code in its canonical APA- form. */
export function normalizeAdaptivePayoutAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APA-")) return clean;
  return `APA-${clean.replaceAll(" ", "-")}`;
}
