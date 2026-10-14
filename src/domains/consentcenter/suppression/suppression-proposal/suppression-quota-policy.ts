import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSuppressionQuota(): number {
  const policy = retry.defaultPolicy("suppression-quota");
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

/** Puts a suppression quota code in its canonical SQ- form. */
export function normalizeSuppressionQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SQ-")) return clean;
  return `SQ-${clean.replaceAll(" ", "-")}`;
}
