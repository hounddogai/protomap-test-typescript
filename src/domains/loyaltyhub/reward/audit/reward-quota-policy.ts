import * as retry from "../../../../kit/retry.js";

/** Puts a reward quota code in its canonical RQ- form. */
export function normalizeRewardQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RQ-")) return clean;
  return `RQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardQuota(): number {
  const policy = retry.defaultPolicy("reward-quota");
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
