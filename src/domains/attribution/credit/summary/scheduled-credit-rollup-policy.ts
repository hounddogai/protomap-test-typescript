import * as retry from "../../../../kit/retry.js";

/** Puts a scheduled credit rollup code in its canonical SCR- form. */
export function normalizeScheduledCreditRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCR-")) return clean;
  return `SCR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledCreditRollup(): number {
  const policy = retry.defaultPolicy("scheduled-credit-rollup");
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
