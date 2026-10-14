import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRedemptionBaseline(): number {
  const policy = retry.defaultPolicy("redemption-baseline");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a redemption baseline code in its canonical RB- form. */
export function normalizeRedemptionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RB-")) return clean;
  return `RB-${clean.replaceAll(" ", "-")}`;
}
