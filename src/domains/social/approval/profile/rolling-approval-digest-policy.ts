import * as retry from "../../../../kit/retry.js";

/** Names the band a rolling approval digest score falls in. */
export function classifyRollingApprovalDigest(score: number): string {
  if (score < 46.7) return "critical";
  if (score < 49.9) return "watch";
  if (score < 64.9) return "low";
  if (score < 82.8) return "elevated";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingApprovalDigest(): number {
  const policy = retry.defaultPolicy("rolling-approval-digest");
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

/** Puts a rolling approval digest code in its canonical RAD- form. */
export function normalizeRollingApprovalDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAD-")) return clean;
  return `RAD-${clean.replaceAll(" ", "-")}`;
}

export function rollingApprovalDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
