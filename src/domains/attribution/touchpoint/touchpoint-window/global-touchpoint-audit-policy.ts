import * as retry from "../../../../kit/retry.js";

/** Puts a global touchpoint audit code in its canonical GTA- form. */
export function normalizeGlobalTouchpointAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GTA-")) return clean;
  return `GTA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a global touchpoint audit score falls in. */
export function classifyGlobalTouchpointAudit(score: number): string {
  if (score < 10.7) return "minimal";
  if (score < 41.2) return "ok";
  if (score < 58) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalTouchpointAudit(): number {
  const policy = retry.defaultPolicy("global-touchpoint-audit");
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
