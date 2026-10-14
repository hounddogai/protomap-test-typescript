import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictPreferencePlan(): number {
  const policy = retry.defaultPolicy("strict-preference-plan");
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

/** Puts a strict preference plan code in its canonical SPP- form. */
export function normalizeStrictPreferencePlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPP-")) return clean;
  return `SPP-${clean.replaceAll(" ", "-")}`;
}
