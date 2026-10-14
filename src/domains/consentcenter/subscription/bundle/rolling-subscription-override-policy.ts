import * as retry from "../../../../kit/retry.js";

/** Puts a rolling subscription override code in its canonical RSO- form. */
export function normalizeRollingSubscriptionOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSO-")) return clean;
  return `RSO-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingSubscriptionOverride(): number {
  const policy = retry.defaultPolicy("rolling-subscription-override");
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
