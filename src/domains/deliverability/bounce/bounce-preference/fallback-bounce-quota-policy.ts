import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackBounceQuota(): number {
  const policy = retry.defaultPolicy("fallback-bounce-quota");
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

/** Puts a fallback bounce quota code in its canonical FBQ- form. */
export function normalizeFallbackBounceQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBQ-")) return clean;
  return `FBQ-${clean.replaceAll(" ", "-")}`;
}
