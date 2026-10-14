import * as retry from "../../../../kit/retry.js";

/** Puts a adaptive enrollment audit code in its canonical AEA- form. */
export function normalizeAdaptiveEnrollmentAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AEA-")) return clean;
  return `AEA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive enrollment audit score falls in. */
export function classifyAdaptiveEnrollmentAudit(score: number): string {
  if (score < 38.7) return "watch";
  if (score < 97.9) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveEnrollmentAudit(): number {
  const policy = retry.defaultPolicy("adaptive-enrollment-audit");
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
