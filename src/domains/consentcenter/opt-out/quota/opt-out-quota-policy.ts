import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeOptOutQuota(): number {
  const policy = retry.defaultPolicy("opt-out-quota");
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

/** Puts a opt out quota code in its canonical OOQ- form. */
export function normalizeOptOutQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOQ-")) return clean;
  return `OOQ-${clean.replaceAll(" ", "-")}`;
}
