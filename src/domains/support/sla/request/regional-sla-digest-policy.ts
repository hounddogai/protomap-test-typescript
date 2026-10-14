import * as retry from "../../../../kit/retry.js";

/** Puts a regional sla digest code in its canonical RSD- form. */
export function normalizeRegionalSlaDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSD-")) return clean;
  return `RSD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalSlaDigest(): number {
  const policy = retry.defaultPolicy("regional-sla-digest");
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
