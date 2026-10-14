import * as retry from "../../../../kit/retry.js";

/** Puts a scheduled escalation notice code in its canonical SEN- form. */
export function normalizeScheduledEscalationNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SEN-")) return clean;
  return `SEN-${clean.replaceAll(" ", "-")}`;
}

export function scheduledEscalationNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledEscalationNotice(): number {
  const policy = retry.defaultPolicy("scheduled-escalation-notice");
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
