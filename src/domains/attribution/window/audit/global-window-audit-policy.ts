import * as retry from "../../../../kit/retry.js";

export function globalWindowAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalWindowAudit(): number {
  const policy = retry.defaultPolicy("global-window-audit");
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
