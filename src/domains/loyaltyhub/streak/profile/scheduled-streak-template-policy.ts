import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledStreakTemplate(): number {
  const policy = retry.defaultPolicy("scheduled-streak-template");
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

export function scheduledStreakTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a scheduled streak template code in its canonical SST- form. */
export function normalizeScheduledStreakTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SST-")) return clean;
  return `SST-${clean.replaceAll(" ", "-")}`;
}
