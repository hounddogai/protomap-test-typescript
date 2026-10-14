import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualTouchpointPolicy(): number {
  const policy = retry.defaultPolicy("manual-touchpoint-policy");
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

/** Puts a manual touchpoint policy code in its canonical MTP- form. */
export function normalizeManualTouchpointPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MTP-")) return clean;
  return `MTP-${clean.replaceAll(" ", "-")}`;
}

export function manualTouchpointPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
