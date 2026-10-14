import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualInviteTemplate(): number {
  const policy = retry.defaultPolicy("manual-invite-template");
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

export function manualInviteTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a manual invite template code in its canonical MIT- form. */
export function normalizeManualInviteTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MIT-")) return clean;
  return `MIT-${clean.replaceAll(" ", "-")}`;
}
