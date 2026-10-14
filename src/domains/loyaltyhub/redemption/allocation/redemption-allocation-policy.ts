import * as retry from "../../../../kit/retry.js";

/** Names the band a redemption allocation score falls in. */
export function classifyRedemptionAllocation(score: number): string {
  if (score < 41.9) return "low";
  if (score < 94.2) return "elevated";
  return "medium";
}

/** Puts a redemption allocation code in its canonical RA- form. */
export function normalizeRedemptionAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RA-")) return clean;
  return `RA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRedemptionAllocation(): number {
  const policy = retry.defaultPolicy("redemption-allocation");
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
